package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	Name         string    `json:"name" gorm:"not null"`
	Username     string    `json:"username" gorm:"uniqueIndex;not null"`
	Phone        string    `json:"phone" gorm:"uniqueIndex;not null"`
	Password     string    `json:"-" gorm:"not null"`
	IsSuperAdmin bool      `json:"is_super_admin" gorm:"default:false"`
	Roles        []Role    `json:"roles,omitempty" gorm:"many2many:user_roles;"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// HasPermission checks if the user has a specific permission through any of their roles
func (u *User) HasPermission(permName string) bool {
	if u.IsSuperAdmin {
		return true
	}
	for _, role := range u.Roles {
		for _, perm := range role.Permissions {
			if perm.Name == permName {
				return true
			}
		}
	}
	return false
}

// GetAllPermissions returns a deduplicated list of all permission names
func (u *User) GetAllPermissions() []string {
	if u.IsSuperAdmin {
		return []string{"*"}
	}
	permMap := make(map[string]bool)
	for _, role := range u.Roles {
		for _, perm := range role.Permissions {
			permMap[perm.Name] = true
		}
	}
	perms := make([]string, 0, len(permMap))
	for p := range permMap {
		perms = append(perms, p)
	}
	return perms
}

// GetRoleNames returns a list of all role names
func (u *User) GetRoleNames() []string {
	names := make([]string, len(u.Roles))
	for i, r := range u.Roles {
		names[i] = r.Name
	}
	return names
}
