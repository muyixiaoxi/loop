package dto

import (
	"time"
)

type User struct {
	ID        uint      `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Nickname  string    `json:"nickname"`
	Password  string    `json:"password,omitempty"`
	Phone     string    `json:"phone,omitempty"`
	Avatar    string    `json:"avatar"`
}

type UserLogin struct {
	Token    string `json:"token"`
	Avatar   string `json:"avatar"`
	Nickname string `json:"nickname"`
}

type FriendShip struct {
	ID        uint      `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	UserId    uint
	FriendId  uint
}

type FriendRequest struct {
	ID          uint      `json:"id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	RequesterId uint      `json:"requester_id"` // 请求者ID
	RecipientId uint      `json:"recipient_id"` // 接收者ID
	Status      int       `json:"status"`       // 0: 未处理 1: 已同意 2: 已拒绝
	Message     string    `json:"message"`      // 请求消息
}

type QueryUserRequest struct {
	Phone  string
	UserId uint
}

type UserInfo struct {
	Nickname string `json:"nickname"`
	Avatar   string `json:"avatar"`
	IsFriend bool   `json:"is_friend"`
}
