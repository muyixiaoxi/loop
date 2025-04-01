package dto

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Nickname string `json:"nickname"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
	Avatar   string `json:"avatar"`
}

type UserLogin struct {
	Token    string `json:"token"`
	Avatar   string `json:"avatar"`
	Nickname string `json:"nickname"`
}
