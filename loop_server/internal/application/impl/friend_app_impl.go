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
}

func NewFriendAppImpl(friendDomain domain.FriendDomain) *friendAppImpl {
	return &friendAppImpl{friendDomain: friendDomain}
}

// AddFriend 添加好友
func (u *friendAppImpl) AddFriend(ctx context.Context, friendId uint, message string) error {

	req := &dto.FriendRequest{
		RequesterId: request.GetCurrentUser(ctx),
		RecipientId: friendId,
		Status:      0,
		Message:     message,
	}
	return u.friendDomain.AddFriend(ctx, req)
}

func (u *friendAppImpl) DisposeFriendRequest(ctx context.Context, requesterId uint, status int) error {
	req := &dto.FriendRequest{
		RequesterId: requesterId,
		RecipientId: request.GetCurrentUser(ctx),
		Status:      status,
	}
	return u.friendDomain.UpdateFriendRequest(ctx, req)
}

func (u *friendAppImpl) GetFriendRequest(ctx context.Context) ([]*dto.FriendRequest, error) {
	return u.friendDomain.GetFriendRequestList(ctx)
}

func (u *friendAppImpl) GetFriendList(ctx context.Context, page *param.Page) ([]*dto.User, error) {
	return u.friendDomain.GetFriendList(ctx, page)
}
