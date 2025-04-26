package impl

import (
	"context"
	"loop_server/infra/consts"
	"loop_server/internal/model/dto"
	"loop_server/internal/repository"
	"loop_server/pkg/request"
)

type groupDomainImpl struct {
	group repository.GroupRepo
}

func NewGroupDomainImpl(group repository.GroupRepo) *groupDomainImpl {
	return &groupDomainImpl{group: group}
}

func (g *groupDomainImpl) CreateGroup(ctx context.Context, req *dto.CreateGroupRequest) (*dto.Group, error) {
	group := &dto.Group{
		Name:     req.Name,
		Avatar:   req.Avatar,
		Describe: req.Describe,
		OwnerId:  request.GetCurrentUser(ctx),
	}
	return g.group.CreateGroup(ctx, group, req.UserIds)
}

func (g *groupDomainImpl) DeleteGroup(ctx context.Context, groupId uint) error {
	return g.group.DeleteGroup(ctx, groupId)
}

func (g *groupDomainImpl) GetGroupList(ctx context.Context, userId uint) ([]*dto.Group, error) {
	return g.group.GetGroupList(ctx, userId)
}

func (g *groupDomainImpl) GetGroupById(ctx context.Context, groupId uint) (*dto.Group, error) {
	return g.group.GetGroup(ctx, groupId)
}

func (g *groupDomainImpl) AddMember(ctx context.Context, ships []*dto.GroupShip) error {
	ship, err := g.group.GetGroupShip(ctx, ships[0].GroupId, request.GetCurrentUser(ctx))
	if err != nil {
		return err
	}
	if ship.Role <= 1 {
		return consts.ErrNoPermission
	}
	return g.group.AddMember(ctx, ships)
}

func (g *groupDomainImpl) DeleteMember(ctx context.Context, groupId, userId uint) error {
	return g.group.DeleteMember(ctx, groupId, userId)
}

func (g *groupDomainImpl) AddAdmin(ctx context.Context, groupId, userId uint) error {
	return g.group.AddAdmin(ctx, groupId, userId)
}

func (g *groupDomainImpl) GetGroupShip(ctx context.Context, groupId, userId uint) (*dto.GroupShip, error) {
	return g.group.GetGroupShip(ctx, groupId, userId)
}

func (g *groupDomainImpl) GetGroupUserId(ctx context.Context, groupId uint) ([]uint, error) {
	return g.group.GetGroupUserId(ctx, groupId)
}
