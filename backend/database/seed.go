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

func Seed(cfg *config.Config) {
	// Seed default permissions
	var allPerms []models.Permission
	for _, pd := range defaultPermissions {
		var perm models.Permission
		result := DB.Where("name = ?", pd.Name).First(&perm)
		if result.RowsAffected == 0 {
			perm = models.Permission{
				Name:        pd.Name,
				GuardName:   "web",
				GroupName:   pd.Group,
				Description: pd.Desc,
			}
			DB.Create(&perm)
			log.Printf("Created permission: %s", pd.Name)
		}
		allPerms = append(allPerms, perm)
	}

	// Seed default Admin role with all permissions
	var adminRole models.Role
	result := DB.Where("name = ?", "Admin").First(&adminRole)
	if result.RowsAffected == 0 {
		adminRole = models.Role{
			Name:        "Admin",
			GuardName:   "web",
			Description: "Administrator with all permissions",
		}
		DB.Create(&adminRole)
		DB.Model(&adminRole).Association("Permissions").Replace(allPerms)
		log.Println("Created Admin role with all permissions")
	}

	// Seed super admin user
	var superAdmin models.User
	result = DB.Where("username = ?", cfg.SuperAdminUsername).First(&superAdmin)
	if result.RowsAffected == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(cfg.SuperAdminPassword), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Failed to hash super admin password: %v", err)
		}

		superAdmin = models.User{
			Name:         cfg.SuperAdminName,
			Username:     cfg.SuperAdminUsername,
			Phone:        cfg.SuperAdminPhone,
			Password:     string(hashedPassword),
			IsSuperAdmin: true,
		}
		DB.Create(&superAdmin)
		log.Printf("Created super admin: %s", cfg.SuperAdminUsername)
	}
}
