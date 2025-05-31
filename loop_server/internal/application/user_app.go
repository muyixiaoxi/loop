package application

import (
	"context"
	"loop_server/internal/model/dto"
)

type UserApp interface {
	Login(ctx context.Context, phone, password string) (*dto.UserLogin, error)
	Register(ctx context.Context, user *dto.User) error
	QueryUser(ctx context.Context, user *dto.QueryUserRequest) (*dto.UserInfo, error)
	UpdateUserInfo(ctx context.Context, user *dto.User) (*dto.User, error)
	UpdateUserPassword(ctx context.Context, old string, new string) (bool, error)
	RefreshToken(ctx context.Context, refreshToken string) (string, error)
}
