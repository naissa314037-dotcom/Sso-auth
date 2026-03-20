package handlers

import (
	"sso-auth/config"
	"sso-auth/database"
	"sso-auth/models"
	"sso-auth/utils"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	Config *config.Config
}

type LoginRequest struct {
	Login    string `json:"login"` // username or phone
	Password string `json:"password"`
}

func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Login == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Login and password are required",
		})
	}

	// Find user by username or phone
	var user models.User
	result := database.DB.Preload("Roles.Permissions").
		Where("username = ? OR phone = ?", req.Login, req.Login).
		First(&user)

	if result.Error != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
		})
	}

	// Generate JWT
	token, err := utils.GenerateToken(&user, h.Config)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate token",
		})
	}

	return c.JSON(fiber.Map{
		"token": token,
		"user": fiber.Map{
			"id":             user.ID,
			"name":           user.Name,
			"username":       user.Username,
			"phone":          user.Phone,
			"is_super_admin": user.IsSuperAdmin,
			"roles":          user.GetRoleNames(),
			"permissions":    user.GetAllPermissions(),
		},
	})
}

func (h *AuthHandler) Me(c *fiber.Ctx) error {
	user := c.Locals("user").(*models.User)

	return c.JSON(fiber.Map{
		"user": fiber.Map{
			"id":             user.ID,
			"name":           user.Name,
			"username":       user.Username,
			"phone":          user.Phone,
			"is_super_admin": user.IsSuperAdmin,
			"roles":          user.GetRoleNames(),
			"permissions":    user.GetAllPermissions(),
		},
	})
}

// JWKS returns the JSON Web Key Set for external services
func (h *AuthHandler) JWKS(c *fiber.Ctx) error {
	return c.JSON(utils.GetJWKS())
}
