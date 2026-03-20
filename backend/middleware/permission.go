package middleware

import (
	"sso-auth/models"

	"github.com/gofiber/fiber/v2"
)

// RequirePermission checks if the authenticated user has the specified permission
func RequirePermission(permission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, ok := c.Locals("user").(*models.User)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "User not found in context",
			})
		}

		// Super admin bypasses all permission checks
		if user.IsSuperAdmin {
			return c.Next()
		}

		if !user.HasPermission(permission) {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error":    "Insufficient permissions",
				"required": permission,
			})
		}

		return c.Next()
	}
}
