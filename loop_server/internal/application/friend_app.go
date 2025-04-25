package application

import (
	"context"
	"loop_server/internal/model/dto"
)

type FriendApp interface {
	AddFriend(ctx context.Context, friendId uint, message string) error
	DeleteFriend(ctx context.Context, friendId uint) error
	DisposeFriendRequest(ctx context.Context, requesterId uint, status int) error
	GetFriendRequest(ctx context.Context) ([]*dto.FriendRequestListNode, error)
	GetFriendList(ctx context.Context) ([]*dto.User, error)
}
