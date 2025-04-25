package repository

import (
	"context"
	"loop_server/internal/model/dto"
)

type FriendRepo interface {
	SaveOrUpdateFriendRequest(ctx context.Context, req *dto.FriendRequest) error
	UpdateFriendRequest(ctx context.Context, req *dto.FriendRequest) error
	QueryFriendShip(ctx context.Context, userId, friendId uint) (*dto.FriendShip, error)
	GetFriendRequestListByRequesterIdOrRecipientId(ctx context.Context, id uint) ([]*dto.FriendRequest, error)
	GetFriendListByUserId(ctx context.Context, userId uint) ([]*dto.User, error)
	IsFriend(ctx context.Context, userId uint, friendId uint) (bool, error)
	DeleteFriend(ctx context.Context, userId uint, friendId uint) error
}
