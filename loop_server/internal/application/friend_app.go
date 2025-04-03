package application

import (
	"context"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/param"
)

type FriendApp interface {
	AddFriend(ctx context.Context, friendId uint, message string) error
	DisposeFriendRequest(ctx context.Context, requesterId uint, status int) error
	GetFriendRequest(ctx context.Context) ([]*dto.FriendRequest, error)
	GetFriendList(ctx context.Context, page *param.Page) ([]*dto.User, error)
}
