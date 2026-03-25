package handlers

import (
	"math"
	"strconv"

	"sso-auth/database"
	"sso-auth/models"

	"github.com/gofiber/fiber/v2"
)

type PermissionHandler struct{}

type CreatePermissionRequest struct {
	Name        string `json:"name"`
	GroupName   string `json:"group_name"`
	Description string `json:"description"`
}

type UpdatePermissionRequest struct {
	Name        string `json:"name"`
	GroupName   string `json:"group_name"`
	Description string `json:"description"`
}

func (h *PermissionHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	perPage, _ := strconv.Atoi(c.Query("per_page", "10"))
	search := c.Query("search", "")
	group := c.Query("group", "")

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 10
	}

	var total int64
	query := database.DB.Model(&models.Permission{})

	if search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("name ILIKE ? OR description ILIKE ? OR group_name ILIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	if group != "" {
		query = query.Where("group_name = ?", group)
	}

	query.Count(&total)

	var permissions []models.Permission
	query.Offset((page - 1) * perPage).
		Limit(perPage).
		Order("group_name ASC, name ASC").
		Find(&permissions)

	// Get all groups for filtering
	var groups []string
	database.DB.Model(&models.Permission{}).Distinct("group_name").Order("group_name ASC").Pluck("group_name", &groups)

	return c.JSON(fiber.Map{
		"data":   permissions,
		"groups": groups,
		"meta": fiber.Map{
			"current_page": page,
			"per_page":     perPage,
			"total":        total,
			"last_page":    int(math.Ceil(float64(total) / float64(perPage))),
		},
	})
}

func (h *PermissionHandler) Create(c *fiber.Ctx) error {
	var req CreatePermissionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if req.Name == "" || req.GroupName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Permission name and group are required",
		})
	}

	var existing models.Permission
	if database.DB.Where("name = ?", req.Name).First(&existing).RowsAffected > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "Permission name already exists",
		})
	}

	permission := models.Permission{
		Name:        req.Name,
		GuardName:   "web",
		GroupName:   req.GroupName,
		Description: req.Description,
	}

	if err := database.DB.Create(&permission).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create permission",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"data": permission})
}

// isDefaultPermission checks if the given name is a default system permission
func isDefaultPermission(name string) bool {
	for _, dp := range database.DefaultPermissionNames() {
		if dp == name {
			return true
		}
	}
	return false
}

func (h *PermissionHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var permission models.Permission
	if database.DB.First(&permission, "id = ?", id).Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Permission not found",
		})
	}

	// Protect default permissions from name change
	var req UpdatePermissionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if isDefaultPermission(permission.Name) && req.Name != "" && req.Name != permission.Name {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Cannot rename a default system permission",
		})
	}

	if req.Name != "" && req.Name != permission.Name {
		var existing models.Permission
		if database.DB.Where("name = ? AND id != ?", req.Name, id).First(&existing).RowsAffected > 0 {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Permission name already exists",
			})
		}
		permission.Name = req.Name
	}

	if req.GroupName != "" {
		permission.GroupName = req.GroupName
	}
	if req.Description != "" {
		permission.Description = req.Description
	}

	database.DB.Save(&permission)

	return c.JSON(fiber.Map{"data": permission})
}

func (h *PermissionHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	var permission models.Permission
	if database.DB.First(&permission, "id = ?", id).Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Permission not found",
		})
	}

	// Protect default permissions from deletion
	if isDefaultPermission(permission.Name) {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Cannot delete a default system permission",
		})
	}

	// Remove from all roles
	database.DB.Model(&permission).Association("Roles").Clear()
	database.DB.Delete(&permission)

	return c.JSON(fiber.Map{"message": "Permission deleted successfully"})
}

// ListAll returns all permissions without pagination (for role assignment UI)
func (h *PermissionHandler) ListAll(c *fiber.Ctx) error {
	var permissions []models.Permission
	database.DB.Order("group_name ASC, name ASC").Find(&permissions)

	// Group by group_name
	grouped := make(map[string][]models.Permission)
	for _, p := range permissions {
		grouped[p.GroupName] = append(grouped[p.GroupName], p)
	}

	return c.JSON(fiber.Map{
		"data":    permissions,
		"grouped": grouped,
	})
}
