package dto

import (
	"time"
)

type Group struct {
	ID        uint       `json:"id"`       // id
	Name      string     `json:"name"`     // 群名称
	Avatar    string     `json:"avatar"`   // 群头像
	Describe  string     `json:"describe"` // 群简介
	OwnerId   uint       `json:"ownerId"`  // 群主id
	CreatedAt *time.Time `json:"created_at,omitempty"`
	UpdatedAt *time.Time `json:"updated_at,omitempty"`
}

type GroupShip struct {
	ID          uint      `json:"id"`
	CreatedAt   time.Time `json:"created_at,omitempty"`
	UpdatedAt   time.Time `json:"updated_at,omitempty"`
	GroupId     uint      `json:"group_id"`
	UserId      uint      `json:"user_id"`
	Role        int       `json:"role"`
	Remark      string    `json:"remark"`
	GroupRemark string    `json:"group_remark"`
}

type CreateGroupRequest struct {
	Name     string `json:"name" binding:"required"`
	Avatar   string `json:"avatar" binding:"required"`
	Describe string `json:"describe"`
	UserIds  []uint `json:"user_ids" binding:"required,min=2"` // 群成员id列表
}
