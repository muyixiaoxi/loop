package domain

import (
	"context"
	"loop_server/internal/model/dto"
)

type FriendDomain interface {
	AddFriend(ctx context.Context, req *dto.FriendRequest) error
	UpdateFriendRequest(ctx context.Context, req *dto.FriendRequest) error
	GetFriendRequestList(ctx context.Context) ([]*dto.FriendRequest, error)
	GetFriendList(ctx context.Context) ([]*dto.User, error)
	IsFriend(ctx context.Context, userId, fiends uint) (bool, error)
}
