package repository

import (
	"context"
	"loop_server/internal/model/dto"
)

type GroupRepo interface {
	CreateGroup(ctx context.Context, dto *dto.Group, userIds []uint) (*dto.Group, error)
	GetGroupList(ctx context.Context, userId uint) ([]*dto.Group, error)
	GetGroup(ctx context.Context, groupId uint) (*dto.Group, error)
	AddMember(ctx context.Context, ship []*dto.GroupShip) error
	DeleteMember(ctx context.Context, groupId uint, userId uint) error
	GetGroupShip(ctx context.Context, groupId, userId uint) (*dto.GroupShip, error)
	AddAdmin(ctx context.Context, groupId, userId uint) error
}
