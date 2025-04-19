package dto

import "time"

type FriendShip struct {
	ID        uint      `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	UserId    uint
	FriendId  uint
}

type FriendRequest struct {
	ID          uint       `json:"id"`
	CreatedAt   *time.Time `json:"created_at,omitempty"`
	UpdatedAt   *time.Time `json:"updated_at,omitempty"`
	RequesterId uint       `json:"requester_id"` // 请求者ID
	RecipientId uint       `json:"recipient_id"` // 接收者ID
	Status      int        `json:"status"`       // 0: 未处理 1: 已同意 2: 已拒绝
	Message     string     `json:"message"`      // 请求消息
}

type FriendRequestListNode struct {
	RequesterId uint   `json:"requester_id"` // 请求者ID
	RecipientId uint   `json:"recipient_id"` // 接收者ID
	Status      int    `json:"status"`       // 0: 未处理 1: 已同意 2: 已拒绝
	Message     string `json:"message"`      // 请求消息
	Nickname    string `json:"name"`         // 昵称
	Avatar      string `json:"avatar"`       // 头像
}
