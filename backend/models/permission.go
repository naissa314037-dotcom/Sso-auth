package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Permission struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	Name        string    `json:"name" gorm:"uniqueIndex;not null"`
	GuardName   string    `json:"guard_name" gorm:"default:'web'"`
	GroupName   string    `json:"group_name" gorm:"index;not null"`
	Description string    `json:"description"`
	Roles       []Role    `json:"-" gorm:"many2many:role_permissions;"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (p *Permission) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
