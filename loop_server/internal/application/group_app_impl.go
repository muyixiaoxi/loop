package application

import (
	"context"
	"loop_server/internal/model/dto"
)

type GroupApp interface {
	CreateGroup(ctx context.Context, group *dto.CreateGroupRequest) (*dto.Group, error)
	GetGroupList(ctx context.Context) ([]*dto.Group, error)
	AddMember(ctx context.Context, groupId uint, userIds []uint) error
	DeleteMember(c context.Context, groupId uint, userId uint) error
	AddAdmin(ctx context.Context, groupId, userId uint) error
}
