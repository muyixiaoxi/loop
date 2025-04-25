package impl

import (
	"context"
	"github.com/samber/lo"
	"loop_server/infra/consts"
	"loop_server/internal/domain"
	"loop_server/internal/model/dto"
	"loop_server/pkg/request"
)

type groupAppImpl struct {
	group domain.GroupDomain
	user  domain.UserDomain
}

func NewGroupAppImpl(group domain.GroupDomain, user domain.UserDomain) *groupAppImpl {
	return &groupAppImpl{group: group, user: user}
}

func (g *groupAppImpl) CreateGroup(ctx context.Context, group *dto.CreateGroupRequest) (*dto.Group, error) {
	// 判断用户是否存在
	exist, err := g.isUserExist(ctx, group.UserIds)
	if !exist || err != nil {
		return nil, err
	}

	return g.group.CreateGroup(ctx, group)
}

func (g *groupAppImpl) GetGroupList(ctx context.Context) ([]*dto.Group, error) {
	return g.group.GetGroupList(ctx, request.GetCurrentUser(ctx))
}

func (g *groupAppImpl) AddMember(ctx context.Context, groupId uint, userIds []uint) error {
	exist, err := g.isUserExist(ctx, userIds)
	if !exist || err != nil {
		return err
	}

	ship := make([]*dto.GroupShip, 0, len(userIds))
	for _, id := range userIds {
		ship = append(ship, &dto.GroupShip{
			UserId:  id,
			GroupId: groupId,
			Role:    consts.GroupRoleMember,
		})
	}
	return g.group.AddMember(ctx, ship)
}

func (g *groupAppImpl) DeleteMember(ctx context.Context, groupId uint, userId uint) error {
	curShip, err := g.group.GetGroupShip(ctx, groupId, request.GetCurrentUser(ctx))
	if err != nil {
		return err
	}
	userShip, err := g.group.GetGroupShip(ctx, groupId, userId)
	if err != nil {
		return err
	}
	if curShip.Role >= consts.GroupRoleAdmin && curShip.Role > userShip.Role {
		return g.group.DeleteMember(ctx, groupId, userId)
	}
	return consts.ErrNoPermission
}

func (g *groupAppImpl) isUserExist(ctx context.Context, userIds []uint) (bool, error) {
	userIds = lo.Uniq(userIds)
	users, err := g.user.GetUserListByUserIds(ctx, userIds)
	if err != nil {
		return false, err
	}
	if len(users) != len(userIds) {
		return false, consts.ErrPartUserNotExist
	}
	return true, nil
}

func (g *groupAppImpl) AddAdmin(ctx context.Context, groupId, userId uint) error {
	group, err := g.group.GetGroupById(ctx, groupId)
	if err != nil {
		return err
	}
	if group.OwnerId != request.GetCurrentUser(ctx) {
		return consts.ErrNoPermission
	}
	return g.group.AddAdmin(ctx, groupId, userId)
}
