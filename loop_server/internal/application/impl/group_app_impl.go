package impl

import (
	"context"
	"encoding/json"
	"github.com/samber/lo"
	"loop_server/infra/consts"
	"loop_server/internal/domain"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/param"
	"loop_server/pkg/request"
)

type groupAppImpl struct {
	group domain.GroupDomain
	user  domain.UserDomain
	im    domain.ImDomain
}

func NewGroupAppImpl(group domain.GroupDomain, user domain.UserDomain, im domain.ImDomain) *groupAppImpl {
	return &groupAppImpl{group: group, user: user, im: im}
}

func (g *groupAppImpl) CreateGroup(ctx context.Context, group *dto.CreateGroupRequest) (*dto.Group, error) {
	// 判断用户是否存在
	exist, err := g.isUserExist(ctx, group.UserIds)
	if !exist || err != nil {
		return nil, err
	}

	data, msg, err := g.group.CreateGroup(ctx, group)
	if err != nil {
		return nil, err
	}

	user, err := g.user.QueryUser(ctx, &dto.QueryUserRequest{UserId: request.GetCurrentUser(ctx)})
	if err != nil {
		return nil, err
	}

	receiverIds := make([]uint, 0)
	json.Unmarshal([]byte(msg.ReceiverIds), &receiverIds)
	g.im.SendGroupMessage(ctx, &dto.GroupMessage{
		SeqId:          msg.SeqId,
		SenderId:       msg.SenderId,
		ReceiverId:     msg.GroupId,
		ReceiverIds:    receiverIds,
		Content:        "",
		Type:           msg.Type,
		SendTime:       msg.SendTime,
		SenderNickname: user.Nickname,
		SenderAvatar:   "",
		GroupName:      data.Name,
		GroupAvatar:    data.Avatar,
	}, append(group.UserIds, user.ID))

	return data, nil
}

func (g *groupAppImpl) UpdateGroup(ctx context.Context, group *dto.UpdateGroupRequest) (*dto.Group, error) {

	ship, err := g.group.GetGroupShipByUserId(ctx, group.GroupId, request.GetCurrentUser(ctx))
	if err != nil {
		return nil, err
	}
	if ship.Role <= consts.GroupRoleAdmin {
		return nil, consts.ErrNoPermission
	}

	return g.group.UpdateGroup(ctx, group)
}

func (g *groupAppImpl) DeleteGroup(ctx context.Context, groupId uint) error {
	group, err := g.group.GetGroupById(ctx, groupId)
	if err != nil {
		return err
	}
	if group.OwnerId != request.GetCurrentUser(ctx) {
		return consts.ErrNoPermission
	}
	return g.group.DeleteGroup(ctx, groupId)
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

func (g *groupAppImpl) DeleteMember(ctx context.Context, groupId uint, userIds []uint) error {
	curShip, err := g.group.GetGroupShipByUserId(ctx, groupId, request.GetCurrentUser(ctx))
	if err != nil {
		return err
	}

	return g.group.DeleteMember(ctx, groupId, userIds, curShip.Role)
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

func (g *groupAppImpl) AddAdmin(ctx context.Context, groupId uint, userId []uint) error {
	group, err := g.group.GetGroupById(ctx, groupId)
	if err != nil {
		return err
	}

	if group.ID == 0 || group.OwnerId != request.GetCurrentUser(ctx) {
		return consts.ErrNoPermission
	}
	return g.group.AddAdmin(ctx, groupId, userId)
}

func (g *groupAppImpl) DeleteAdmin(ctx context.Context, groupId, userId uint) error {
	group, err := g.group.GetGroupById(ctx, groupId)
	if err != nil {
		return err
	}

	if group.ID == 0 || group.OwnerId != request.GetCurrentUser(ctx) {
		return consts.ErrNoPermission
	}

	return g.group.DeleteAdmin(ctx, groupId, userId)
}

func (g *groupAppImpl) GetGroup(ctx context.Context, groupId uint) (*dto.Group, error) {
	group, err := g.group.GetGroupById(ctx, groupId)
	if err != nil {
		return nil, err
	}
	ship, err := g.group.GetGroupShipByRole(ctx, groupId, consts.GroupRoleAdmin)
	if err != nil {
		return nil, err
	}
	userIds := make([]uint, 0, len(ship))
	for _, groupShip := range ship {
		userIds = append(userIds, groupShip.UserId)
	}

	group.AdminIds = userIds

	return group, nil
}

func (g *groupAppImpl) GetGroupMemberList(ctx context.Context, groupId uint) ([]*param.Member, error) {
	ships, err := g.group.GetGroupShip(ctx, groupId)
	if err != nil {
		return nil, err
	}
	userIds := make([]uint, 0, len(ships))
	shipMap := make(map[uint]uint, len(ships))
	for _, ship := range ships {
		userIds = append(userIds, ship.UserId)
		shipMap[ship.UserId] = ship.Role
	}
	users, err := g.user.GetUserListByUserIds(ctx, userIds)
	if err != nil {
		return nil, err
	}

	members := make([]*param.Member, 0, len(users))
	for _, user := range users {
		members = append(members, &param.Member{
			UserID:    user.ID,
			Nickname:  user.Nickname,
			Avatar:    user.Avatar,
			Signature: user.Signature,
			Gender:    user.Gender,
			Age:       user.Age,
			Role:      shipMap[user.ID],
		})
	}

	return members, nil
}

func (g *groupAppImpl) GetGroupMemberListByLessRole(ctx context.Context, groupId uint) ([]*param.Member, error) {
	ship, err := g.group.GetGroupShipByUserId(ctx, groupId, request.GetCurrentUser(ctx))
	if err != nil {
		return nil, err
	}

	ships, err := g.group.GetGroupShipByLessRole(ctx, groupId, ship.Role)
	if err != nil {
		return nil, err
	}
	userIds := make([]uint, 0, len(ships))
	shipMap := make(map[uint]uint, len(ships))
	for _, ship := range ships {
		userIds = append(userIds, ship.UserId)
		shipMap[ship.UserId] = ship.Role
	}
	users, err := g.user.GetUserListByUserIds(ctx, userIds)
	if err != nil {
		return nil, err
	}

	members := make([]*param.Member, 0, len(users))
	for _, user := range users {
		members = append(members, &param.Member{
			UserID:    user.ID,
			Nickname:  user.Nickname,
			Avatar:    user.Avatar,
			Signature: user.Signature,
			Gender:    user.Gender,
			Age:       user.Age,
			Role:      shipMap[user.ID],
		})
	}

	return members, nil
}

func (g *groupAppImpl) ExitGroup(ctx context.Context, groupId uint) error {
	group, err := g.group.GetGroupById(ctx, groupId)
	if err != nil {
		return err
	}
	if group.OwnerId != request.GetCurrentUser(ctx) {
		return g.group.DeleteGroup(ctx, groupId)
	}
	return g.group.DeleteMember(ctx, groupId, []uint{request.GetCurrentUser(ctx)}, consts.GroupRoleOwner)
}

func (g *groupAppImpl) TransferGroupOwner(ctx context.Context, groupId uint, userId uint) error {
	group, err := g.group.GetGroupById(ctx, groupId)
	if err != nil {
		return err
	}
	if group.OwnerId != request.GetCurrentUser(ctx) {
		return consts.ErrNoPermission
	}
	return g.group.TransferGroupOwner(ctx, groupId, request.GetCurrentUser(ctx), userId)
}
