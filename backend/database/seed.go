package database

import (
	"log"

	"sso-auth/config"
	"sso-auth/models"

	"golang.org/x/crypto/bcrypt"
)

type permDef struct {
	Name  string
	Group string
	Desc  string
}

var defaultPermissions = []permDef{
	// Users
	{"users.view", "users", "View users list"},
	{"users.create", "users", "Create new users"},
	{"users.edit", "users", "Edit existing users"},
	{"users.delete", "users", "Delete users"},
	// Roles
	{"roles.view", "roles", "View roles list"},
	{"roles.create", "roles", "Create new roles"},
	{"roles.edit", "roles", "Edit existing roles"},
	{"roles.delete", "roles", "Delete roles"},
	// Permissions
	{"permissions.view", "permissions", "View permissions list"},
	{"permissions.create", "permissions", "Create new permissions"},
	{"permissions.edit", "permissions", "Edit existing permissions"},
	{"permissions.delete", "permissions", "Delete permissions"},
}

// DefaultPermissionNames returns a list of all default permission names
// Used by handlers to protect default permissions from deletion
func DefaultPermissionNames() []string {
	names := make([]string, len(defaultPermissions))
	for i, p := range defaultPermissions {
		names[i] = p.Name
	}
	return names
}

func Seed(cfg *config.Config) {
	// Check if super admin already exists — if so, skip seeding entirely
	var superAdmin models.User
	result := DB.Where("username = ?", cfg.SuperAdminUsername).First(&superAdmin)
	if result.RowsAffected > 0 {
		log.Println("Seeding skipped: super admin already exists, data is safe")
		return
	}

	// First run — seed everything inside a transaction
	log.Println("First run detected: seeding default data...")

	tx := DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Fatalf("Seeding panicked: %v", r)
		}
	}()

	// 1. Seed default permissions
	var allPerms []models.Permission
	for _, pd := range defaultPermissions {
		perm := models.Permission{
			Name:        pd.Name,
			GuardName:   "web",
			GroupName:   pd.Group,
			Description: pd.Desc,
		}
		if err := tx.Create(&perm).Error; err != nil {
			tx.Rollback()
			log.Fatalf("Failed to create permission %s: %v", pd.Name, err)
		}
		allPerms = append(allPerms, perm)
		log.Printf("  Created permission: %s", pd.Name)
	}

	// 2. Seed default Admin role with all permissions
	adminRole := models.Role{
		Name:        "Admin",
		GuardName:   "web",
		Description: "Administrator with all permissions",
	}
	if err := tx.Create(&adminRole).Error; err != nil {
		tx.Rollback()
		log.Fatalf("Failed to create Admin role: %v", err)
	}
	if err := tx.Model(&adminRole).Association("Permissions").Replace(allPerms); err != nil {
		tx.Rollback()
		log.Fatalf("Failed to assign permissions to Admin role: %v", err)
	}
	log.Println("  Created Admin role with all permissions")

	// 3. Seed super admin user
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(cfg.SuperAdminPassword), bcrypt.DefaultCost)
	if err != nil {
		tx.Rollback()
		log.Fatalf("Failed to hash super admin password: %v", err)
	}

	superAdmin = models.User{
		Name:         cfg.SuperAdminName,
		Username:     cfg.SuperAdminUsername,
		Phone:        cfg.SuperAdminPhone,
		Password:     string(hashedPassword),
		IsSuperAdmin: true,
	}
	if err := tx.Create(&superAdmin).Error; err != nil {
		tx.Rollback()
		log.Fatalf("Failed to create super admin: %v", err)
	}
	log.Printf("  Created super admin: %s", cfg.SuperAdminUsername)

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Fatalf("Failed to commit seed transaction: %v", err)
	}

	log.Println("Seeding completed successfully")
}
