package impl

import (
	"context"
	"loop_server/internal/model/dto"
	"loop_server/internal/repository"
	"loop_server/pkg/request"
)

type friendDomainImpl struct {
	friendRepo repository.FriendRepo
}

func NewFriendDomainImpl(friendRepo repository.FriendRepo) *friendDomainImpl {
	return &friendDomainImpl{
		friendRepo: friendRepo,
	}
}

// AddFriend 添加好友
func (u *friendDomainImpl) AddFriend(ctx context.Context, req *dto.FriendRequest) error {
	return u.friendRepo.SaveOrUpdateFriendRequest(ctx, req)
}

func (u *friendDomainImpl) UpdateFriendRequest(ctx context.Context, request *dto.FriendRequest) error {
	return u.friendRepo.UpdateFriendRequest(ctx, request)
}

func (u *friendDomainImpl) GetFriendRequestList(ctx context.Context) ([]*dto.FriendRequest, error) {
	return u.friendRepo.GetFriendRequestListByRequesterIdOrRecipientId(ctx, request.GetCurrentUser(ctx))
}

func (u *friendDomainImpl) GetFriendList(ctx context.Context) ([]*dto.User, error) {
	return u.friendRepo.GetFriendListByUserId(ctx, request.GetCurrentUser(ctx))
}

func (u *friendDomainImpl) IsFriend(ctx context.Context, userId, friendId uint) (bool, error) {
	return u.friendRepo.IsFriend(ctx, userId, friendId)
}
