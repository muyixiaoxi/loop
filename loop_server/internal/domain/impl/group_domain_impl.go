package impl

import (
	"context"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/po"
	"loop_server/internal/repository"
	"loop_server/pkg/request"
)

type groupDomainImpl struct {
	group repository.GroupRepo
}

func NewGroupDomainImpl(group repository.GroupRepo) *groupDomainImpl {
	return &groupDomainImpl{group: group}
}

func (g *groupDomainImpl) CreateGroup(ctx context.Context, req *dto.CreateGroupRequest) (*dto.Group, *po.GroupMessage, error) {
	group := &dto.Group{
		Name:     req.Name,
		Avatar:   req.Avatar,
		Describe: req.Describe,
		OwnerId:  request.GetCurrentUser(ctx),
	}
	return g.group.CreateGroup(ctx, group, req.UserIds)
}

func (g *groupDomainImpl) UpdateGroup(ctx context.Context, group *dto.UpdateGroupRequest) (*dto.Group, error) {
	gp := &dto.Group{
		ID:       group.GroupId,
		Name:     group.Name,
		Avatar:   group.Avatar,
		Describe: group.Describe,
	}
	return g.group.UpdateGroup(ctx, gp)
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

	return g.group.AddMember(ctx, ships)
}

func (g *groupDomainImpl) DeleteMember(ctx context.Context, groupId uint, userIds []uint, role uint) error {
	return g.group.DeleteMember(ctx, groupId, userIds, role)
}

func (g *groupDomainImpl) AddAdmin(ctx context.Context, groupId uint, userId []uint) error {
	return g.group.AddAdmin(ctx, groupId, userId)
}

func (g *groupDomainImpl) DeleteAdmin(ctx context.Context, groupId, userId uint) error {
	return g.group.DeleteAdmin(ctx, groupId, userId)
}

func (g *groupDomainImpl) GetGroupShipByUserId(ctx context.Context, groupId, userId uint) (*dto.GroupShip, error) {
	return g.group.GetGroupShipByUserId(ctx, groupId, userId)
}

func (g *groupDomainImpl) GetGroupShipByRole(ctx context.Context, groupId, role uint) ([]*dto.GroupShip, error) {
	return g.group.GetGroupShipByRole(ctx, groupId, role)
}

func (g *groupDomainImpl) GetGroupUserId(ctx context.Context, groupId uint) ([]uint, error) {
	return g.group.GetGroupUserId(ctx, groupId)
}

func (g *groupDomainImpl) GetGroupShip(ctx context.Context, groupId uint) ([]*dto.GroupShip, error) {
	return g.group.GetGroupShip(ctx, groupId)
}

func (g *groupDomainImpl) GetGroupShipByLessRole(ctx context.Context, groupId uint, role uint) ([]*dto.GroupShip, error) {
	return g.group.GetGroupShipByLessRole(ctx, groupId, role)
}

func (g *groupDomainImpl) TransferGroupOwner(ctx context.Context, groupId uint, curOwner, userId uint) error {
	return g.group.TransferGroupOwner(ctx, groupId, curOwner, userId)
}
