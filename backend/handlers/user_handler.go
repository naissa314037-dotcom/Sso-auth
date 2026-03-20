package handlers

import (
	"math"
	"strconv"

	"sso-auth/database"
	"sso-auth/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserHandler struct{}

type CreateUserRequest struct {
	Name     string   `json:"name"`
	Username string   `json:"username"`
	Phone    string   `json:"phone"`
	Password string   `json:"password"`
	RoleIDs  []string `json:"role_ids"`
}

type UpdateUserRequest struct {
	Name     string   `json:"name"`
	Username string   `json:"username"`
	Phone    string   `json:"phone"`
	Password string   `json:"password,omitempty"`
	RoleIDs  []string `json:"role_ids"`
}

type AssignRolesRequest struct {
	RoleIDs []string `json:"role_ids"`
}

func (h *UserHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	search := c.Query("search", "")

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}

	var total int64
	query := database.DB.Model(&models.User{})

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("name ILIKE ? OR username ILIKE ? OR phone ILIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	query.Count(&total)

	var users []models.User
	query.Preload("Roles.Permissions").
		Offset((page - 1) * perPage).
		Limit(perPage).
		Order("created_at DESC").
		Find(&users)

	return c.JSON(fiber.Map{
		"data": users,
		"meta": fiber.Map{
			"current_page": page,
			"per_page":     perPage,
			"total":        total,
			"last_page":    int(math.Ceil(float64(total) / float64(perPage))),
		},
	})
}

func (h *UserHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	var user models.User
	result := database.DB.Preload("Roles.Permissions").First(&user, "id = ?", id)
	if result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	return c.JSON(fiber.Map{"data": user})
}

func (h *UserHandler) Create(c *fiber.Ctx) error {
	var req CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Name == "" || req.Username == "" || req.Phone == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Name, username, phone, and password are required",
		})
	}

	// Check for duplicates
	var existing models.User
	if database.DB.Where("username = ?", req.Username).First(&existing).RowsAffected > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Username already exists",
		})
	}
	if database.DB.Where("phone = ?", req.Phone).First(&existing).RowsAffected > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Phone number already exists",
		})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to hash password",
		})
	}

	user := models.User{
		Name:     req.Name,
		Username: req.Username,
		Phone:    req.Phone,
		Password: string(hashedPassword),
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create user",
		})
	}

	// Assign roles if provided
	if len(req.RoleIDs) > 0 {
		var roles []models.Role
		for _, rid := range req.RoleIDs {
			uid, err := uuid.Parse(rid)
			if err != nil {
				continue
			}
			roles = append(roles, models.Role{ID: uid})
		}
		database.DB.Model(&user).Association("Roles").Replace(roles)
	}

	// Reload with associations
	database.DB.Preload("Roles.Permissions").First(&user, "id = ?", user.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": user})
}

func (h *UserHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var user models.User
	if database.DB.First(&user, "id = ?", id).Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	var req UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Check username uniqueness if changed
	if req.Username != "" && req.Username != user.Username {
		var existing models.User
		if database.DB.Where("username = ? AND id != ?", req.Username, id).First(&existing).RowsAffected > 0 {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Username already exists",
			})
		}
		user.Username = req.Username
	}

	// Check phone uniqueness if changed
	if req.Phone != "" && req.Phone != user.Phone {
		var existing models.User
		if database.DB.Where("phone = ? AND id != ?", req.Phone, id).First(&existing).RowsAffected > 0 {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Phone number already exists",
			})
		}
		user.Phone = req.Phone
	}

	if req.Name != "" {
		user.Name = req.Name
	}

	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to hash password",
			})
		}
		user.Password = string(hashedPassword)
	}

	database.DB.Save(&user)

	// Update roles if provided
	if req.RoleIDs != nil {
		var roles []models.Role
		for _, rid := range req.RoleIDs {
			uid, err := uuid.Parse(rid)
			if err != nil {
				continue
			}
			roles = append(roles, models.Role{ID: uid})
		}
		database.DB.Model(&user).Association("Roles").Replace(roles)
	}

	database.DB.Preload("Roles.Permissions").First(&user, "id = ?", user.ID)

	return c.JSON(fiber.Map{"data": user})
}

func (h *UserHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	var user models.User
	if database.DB.First(&user, "id = ?", id).Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	if user.IsSuperAdmin {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Cannot delete super admin",
		})
	}

	// Remove role associations
	database.DB.Model(&user).Association("Roles").Clear()
	database.DB.Delete(&user)

	return c.JSON(fiber.Map{"message": "User deleted successfully"})
}

func (h *UserHandler) AssignRoles(c *fiber.Ctx) error {
	id := c.Params("id")

	var user models.User
	if database.DB.First(&user, "id = ?", id).Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "User not found",
		})
	}

	var req AssignRolesRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	var roles []models.Role
	for _, rid := range req.RoleIDs {
		uid, err := uuid.Parse(rid)
		if err != nil {
			continue
		}
		roles = append(roles, models.Role{ID: uid})
	}

	database.DB.Model(&user).Association("Roles").Replace(roles)
	database.DB.Preload("Roles.Permissions").First(&user, "id = ?", user.ID)

	return c.JSON(fiber.Map{"data": user})
}
