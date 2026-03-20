package middleware

import (
	"strings"

	"sso-auth/database"
	"sso-auth/models"
	"sso-auth/utils"

	"github.com/gofiber/fiber/v2"
)

// AuthMiddleware validates JWT and loads the full user with roles and permissions
func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header required",
			})
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization header format",
			})
		}

		claims, err := utils.ParseToken(parts[1])
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		// Load full user with roles and permissions from database
		var user models.User
		result := database.DB.Preload("Roles.Permissions").First(&user, "id = ?", claims.UserID)
		if result.Error != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "User not found",
			})
		}

		c.Locals("user", &user)
		c.Locals("claims", claims)

		return c.Next()
	}
}
