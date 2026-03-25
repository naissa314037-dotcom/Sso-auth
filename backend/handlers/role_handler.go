package handlers

import (
	"math"
	"strconv"

	"sso-auth/database"
	"sso-auth/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type RoleHandler struct{}

type CreateRoleRequest struct {
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	PermissionIDs []string `json:"permission_ids"`
}

type UpdateRoleRequest struct {
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	PermissionIDs []string `json:"permission_ids"`
}

func (h *RoleHandler) List(c *fiber.Ctx) error {
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
	query := database.DB.Model(&models.Role{})

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ?",
			searchPattern, searchPattern)
	}

	query.Count(&total)

	var roles []models.Role
	query.Preload("Permissions").
		Offset((page - 1) * perPage).
		Limit(perPage).
		Order("created_at DESC").
		Find(&roles)

	return c.JSON(fiber.Map{
		"data": roles,
		"meta": fiber.Map{
			"current_page": page,
			"per_page":     perPage,
			"total":        total,
			"last_page":    int(math.Ceil(float64(total) / float64(perPage))),
		},
	})
}

func (h *RoleHandler) Get(c *fiber.Ctx) error {
	id := c.Params("id")

	var role models.Role
	result := database.DB.Preload("Permissions").First(&role, "id = ?", id)
	if result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Role not found",
		})
	}

	return c.JSON(fiber.Map{"data": role})
}

func (h *RoleHandler) Create(c *fiber.Ctx) error {
	var req CreateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Name == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Role name is required",
		})
	}

	// Check duplicate
	var existing models.Role
	if database.DB.Where("name = ?", req.Name).First(&existing).RowsAffected > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Role name already exists",
		})
	}

	role := models.Role{
		Name:        req.Name,
		GuardName:   "web",
		Description: req.Description,
	}

	if err := database.DB.Create(&role).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create role",
		})
	}

	// Assign permissions if provided
	if len(req.PermissionIDs) > 0 {
		var perms []models.Permission
		for _, pid := range req.PermissionIDs {
			uid, err := uuid.Parse(pid)
			if err != nil {
				continue
			}
			perms = append(perms, models.Permission{ID: uid})
		}
		database.DB.Model(&role).Association("Permissions").Replace(perms)
	}

	database.DB.Preload("Permissions").First(&role, "id = ?", role.ID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": role})
}

func (h *RoleHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var role models.Role
	if database.DB.First(&role, "id = ?", id).Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Role not found",
		})
	}

	var req UpdateRoleRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Name != "" && req.Name != role.Name {
		var existing models.Role
		if database.DB.Where("name = ? AND id != ?", req.Name, id).First(&existing).RowsAffected > 0 {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Role name already exists",
			})
		}
		role.Name = req.Name
	}

	if req.Description != "" {
		role.Description = req.Description
	}

	database.DB.Save(&role)

	// Update permissions if provided
	if req.PermissionIDs != nil {
		var perms []models.Permission
		for _, pid := range req.PermissionIDs {
			uid, err := uuid.Parse(pid)
			if err != nil {
				continue
			}
			perms = append(perms, models.Permission{ID: uid})
		}
		database.DB.Model(&role).Association("Permissions").Replace(perms)
	}

	database.DB.Preload("Permissions").First(&role, "id = ?", role.ID)

	return c.JSON(fiber.Map{"data": role})
}

func (h *RoleHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	var role models.Role
	if database.DB.First(&role, "id = ?", id).Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Role not found",
		})
	}

	// Protect default Admin role
	if role.Name == "Admin" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Cannot delete the default Admin role",
		})
	}

	// Remove associations
	database.DB.Model(&role).Association("Permissions").Clear()
	database.DB.Model(&role).Association("Users").Clear()
	database.DB.Delete(&role)

	return c.JSON(fiber.Map{"message": "Role deleted successfully"})
}
