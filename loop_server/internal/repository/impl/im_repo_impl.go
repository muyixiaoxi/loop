package impl

import (
	"gorm.io/gorm"
)

type imRepoImpl struct {
	db *gorm.DB
}

func NewImRepoImpl(db *gorm.DB) *imRepoImpl {
	return &imRepoImpl{db: db}
}
