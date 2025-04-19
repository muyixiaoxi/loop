package dto

import (
	"time"
)

type User struct {
	ID        uint       `json:"id,omitempty"`
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
	Nickname  string     `json:"nickname"`
	Password  string     `json:"password,omitempty"`
	Phone     string     `json:"phone,omitempty"`
	Avatar    string     `json:"avatar,omitempty"`
	Signature string     `json:"signature"`
	Gender    int        `json:"gender,omitempty"`
	Age       int        `json:"age"`
}

type UserLogin struct {
	Token string `json:"token"`
	User  *User  `json:"user"`
}

type QueryUserRequest struct {
	Phone  string
	UserId uint
}

type UserInfo struct {
	Id        uint   `json:"id"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
	Signature string `json:"signature"`
	Gender    int    `json:"gender"`
	Age       int    `json:"age"`
	IsFriend  bool   `json:"is_friend"`
}
