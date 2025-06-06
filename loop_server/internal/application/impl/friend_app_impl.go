package impl

import (
	"context"
	"loop_server/internal/domain"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/param"
	"loop_server/pkg/request"
)

type friendAppImpl struct {
	friendDomain domain.FriendDomain
	userDomain   domain.UserDomain
	groupDomain  domain.GroupDomain
}

func NewFriendAppImpl(friendDomain domain.FriendDomain, userDomain domain.UserDomain, groupAppImpl domain.GroupDomain) *friendAppImpl {
	return &friendAppImpl{friendDomain: friendDomain, userDomain: userDomain, groupDomain: groupAppImpl}
}

// AddFriend 添加好友
func (u *friendAppImpl) AddFriend(ctx context.Context, friendId uint, message string) error {
	if friendId == request.GetCurrentUser(ctx) {
		return nil
	}
	req := &dto.FriendRequest{
		RequesterId: request.GetCurrentUser(ctx),
		RecipientId: friendId,
		Status:      0,
		Message:     message,
	}
	return u.friendDomain.AddFriend(ctx, req)
}

func (u *friendAppImpl) DeleteFriend(ctx context.Context, friendId uint) error {
	return u.friendDomain.DeleteFriend(ctx, request.GetCurrentUser(ctx), friendId)
}

func (u *friendAppImpl) DisposeFriendRequest(ctx context.Context, requesterId uint, status int) error {
	req := &dto.FriendRequest{
		RequesterId: requesterId,
		RecipientId: request.GetCurrentUser(ctx),
		Status:      status,
	}
	return u.friendDomain.UpdateFriendRequest(ctx, req)
}

func (u *friendAppImpl) GetFriendRequest(ctx context.Context) ([]*dto.FriendRequestListNode, error) {
	list, err := u.friendDomain.GetFriendRequestList(ctx)
	if err != nil {
		return nil, err
	}
	userIds := make([]uint, len(list))
	curUserId := request.GetCurrentUser(ctx)
	for _, req := range list {
		if req.RequesterId != curUserId {
			userIds = append(userIds, req.RequesterId)
		}
		if req.RecipientId != curUserId {
			userIds = append(userIds, req.RecipientId)
		}
	}

	users, err := u.userDomain.GetUserListByUserIds(ctx, userIds)
	if err != nil {
		return nil, err
	}
	return u.convertGetFriendRequest(ctx, list, users), nil
}

func (u *friendAppImpl) convertGetFriendRequest(ctx context.Context, requests []*dto.FriendRequest, users []*dto.User) []*dto.FriendRequestListNode {
	hash := make(map[uint]*dto.User, len(users))
	for _, user := range users {
		hash[user.ID] = user
	}
	data := make([]*dto.FriendRequestListNode, 0, len(requests))
	userId := request.GetCurrentUser(ctx)
	for _, req := range requests {
		var nickname, avatar string
		if req.RequesterId != userId {
			nickname = hash[req.RequesterId].Nickname
			avatar = hash[req.RequesterId].Avatar
		} else {
			nickname = hash[req.RecipientId].Nickname
			avatar = hash[req.RecipientId].Avatar
		}
		data = append(data, &dto.FriendRequestListNode{
			RequesterId: req.RequesterId,
			RecipientId: req.RecipientId,
			Status:      req.Status,
			Message:     req.Message,
			Nickname:    nickname,
			Avatar:      avatar,
		})
	}
	return data
}

func (u *friendAppImpl) GetFriendList(ctx context.Context) ([]*dto.User, error) {
	return u.friendDomain.GetFriendList(ctx)
}

func (u *friendAppImpl) FriendListStatistics(ctx context.Context) (*dto.FriendListStatistics, error) {
	return u.friendDomain.FriendRequestStatistics(ctx, request.GetCurrentUser(ctx))
}

func (u *friendAppImpl) GetFriendListByGroupId(ctx context.Context, groupId uint) ([]*param.InviteFriendAddGroupList, error) {
	users, err := u.friendDomain.GetFriendList(ctx)
	if err != nil {
		return nil, err
	}
	groupUsers, err := u.groupDomain.GetGroupUserId(ctx, groupId)
	if err != nil {
		return nil, err
	}
	hash := make(map[uint]bool, len(groupUsers))
	for _, user := range groupUsers {
		hash[user] = true
	}
	var data []*param.InviteFriendAddGroupList
	for _, user := range users {
		data = append(data, &param.InviteFriendAddGroupList{
			UserId:       user.ID,
			UserAvatar:   user.Avatar,
			UserNickname: user.Nickname,
			IsGroup:      hash[user.ID],
		})
	}
	return data, nil
}
