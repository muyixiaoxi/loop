package domain

import (
	"context"
	"loop_server/internal/model/dto"
)

type GroupDomain interface {
	CreateGroup(ctx context.Context, dto *dto.CreateGroupRequest) (*dto.Group, error)
	DeleteGroup(ctx context.Context, groupId uint) error
	GetGroupList(ctx context.Context, userId uint) ([]*dto.Group, error)
	GetGroupById(ctx context.Context, groupId uint) (*dto.Group, error)
	DeleteMember(ctx context.Context, groupId, userId uint) error
	AddMember(ctx context.Context, ships []*dto.GroupShip) error
	AddAdmin(ctx context.Context, groupId, userId uint) error
	GetGroupShip(ctx context.Context, groupId, userId uint) (*dto.GroupShip, error)
	GetGroupUserId(ctx context.Context, groupId uint) ([]uint, error)
}
