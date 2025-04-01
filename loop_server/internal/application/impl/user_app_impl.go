package impl

import (
	"context"
	"loop_server/internal/domain"
	"loop_server/internal/model/dto"
)

type userAppImpl struct {
	userDomain domain.UserDomain
}

func NewUserAppImpl(userDomain domain.UserDomain) *userAppImpl {
	return &userAppImpl{
		userDomain: userDomain,
	}
}

// Login 登录
func (u *userAppImpl) Login(ctx context.Context, phone, password string) (*dto.UserLogin, error) {
	return u.userDomain.Login(ctx, phone, password)
}

// Register 注册
func (u *userAppImpl) Register(ctx context.Context, user *dto.User) error {
	return u.userDomain.Register(ctx, user)
}
