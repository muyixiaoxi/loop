package domain

import (
	"context"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/po"
)

type GroupDomain interface {
	CreateGroup(ctx context.Context, dto *dto.CreateGroupRequest) (*dto.Group, *po.GroupMessage, error)
	UpdateGroup(ctx context.Context, group *dto.UpdateGroupRequest) (*dto.Group, error)
	DeleteGroup(ctx context.Context, groupId uint) error
	GetGroupList(ctx context.Context, userId uint) ([]*dto.Group, error)
	GetGroupById(ctx context.Context, groupId uint) (*dto.Group, error)
	DeleteMember(ctx context.Context, groupId uint, userIds []uint, role uint) error
	AddMember(ctx context.Context, ships []*dto.GroupShip) error
	AddAdmin(ctx context.Context, groupId uint, userId []uint) error
	DeleteAdmin(ctx context.Context, groupId, userId uint) error
	GetGroupShipByUserId(ctx context.Context, groupId, userId uint) (*dto.GroupShip, error)
	GetGroupShipByRole(ctx context.Context, groupId, role uint) ([]*dto.GroupShip, error)
	GetGroupUserId(ctx context.Context, groupId uint) ([]uint, error)
	GetGroupShip(ctx context.Context, groupId uint) ([]*dto.GroupShip, error)
	GetGroupShipByLessRole(ctx context.Context, groupId uint, role uint) ([]*dto.GroupShip, error)
	TransferGroupOwner(ctx context.Context, groupId uint, curOwner, userId uint) error
}
