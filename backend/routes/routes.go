package routes

import (
	"sso-auth/config"
	"sso-auth/handlers"
	"sso-auth/middleware"

	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App, cfg *config.Config) {
	authHandler := &handlers.AuthHandler{Config: cfg}
	userHandler := &handlers.UserHandler{}
	roleHandler := &handlers.RoleHandler{}
	permissionHandler := &handlers.PermissionHandler{}

	// API Group
	api := app.Group("/api")

	// Auth (Public & Protected)
	auth := api.Group("/auth")
	auth.Get("/jwks.json", authHandler.JWKS) // Now at /api/auth/jwks.json
	auth.Post("/login", authHandler.Login)
	auth.Get("/me", middleware.AuthMiddleware(), authHandler.Me)

	// Admin protected routes - Using empty prefix to avoid double slashes like /api//users
	admin := api.Group("", middleware.AuthMiddleware())

	// Users
	users := admin.Group("/users")
	users.Get("/", middleware.RequirePermission("users.view"), userHandler.List)
	// ... (Rest remains identical)
	users.Get("/:id", middleware.RequirePermission("users.view"), userHandler.Get)
	users.Post("/", middleware.RequirePermission("users.create"), userHandler.Create)
	users.Put("/:id", middleware.RequirePermission("users.edit"), userHandler.Update)
	users.Delete("/:id", middleware.RequirePermission("users.delete"), userHandler.Delete)
	users.Post("/:id/roles", middleware.RequirePermission("users.edit"), userHandler.AssignRoles)

	// Roles
	roles := admin.Group("/roles")
	roles.Get("/", middleware.RequirePermission("roles.view"), roleHandler.List)
	roles.Get("/:id", middleware.RequirePermission("roles.view"), roleHandler.Get)
	roles.Post("/", middleware.RequirePermission("roles.create"), roleHandler.Create)
	roles.Put("/:id", middleware.RequirePermission("roles.edit"), roleHandler.Update)
	roles.Delete("/:id", middleware.RequirePermission("roles.delete"), roleHandler.Delete)

	// Permissions
	permissions := admin.Group("/permissions")
	permissions.Get("/", middleware.RequirePermission("permissions.view"), permissionHandler.List)
	permissions.Get("/all", middleware.RequirePermission("permissions.view"), permissionHandler.ListAll)
	permissions.Post("/", middleware.RequirePermission("permissions.create"), permissionHandler.Create)
	permissions.Put("/:id", middleware.RequirePermission("permissions.edit"), permissionHandler.Update)
	permissions.Delete("/:id", middleware.RequirePermission("permissions.delete"), permissionHandler.Delete)
}
