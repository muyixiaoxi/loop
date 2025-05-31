package application

import (
	"context"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/param"
)

type GroupApp interface {
	CreateGroup(ctx context.Context, group *dto.CreateGroupRequest) (*dto.Group, error)
	UpdateGroup(ctx context.Context, group *dto.UpdateGroupRequest) (*dto.Group, error)
	DeleteGroup(ctx context.Context, groupId uint) error
	GetGroup(ctx context.Context, groupId uint) (*dto.Group, error)
	GetGroupList(ctx context.Context) ([]*dto.Group, error)
	ExitGroup(ctx context.Context, groupId uint) error
	AddMember(ctx context.Context, groupId uint, userIds []uint) error
	DeleteMember(c context.Context, groupId uint, userId []uint) error
	AddAdmin(ctx context.Context, groupId uint, userId []uint) error
	DeleteAdmin(ctx context.Context, groupId, userId uint) error
	GetGroupMemberList(ctx context.Context, groupId uint) ([]*param.Member, error)
	GetGroupMemberListByLessRole(ctx context.Context, groupId uint) ([]*param.Member, error)
	TransferGroupOwner(ctx context.Context, groupId uint, userId uint) error
}
