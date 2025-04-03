package application

import (
	"context"
	"loop_server/internal/model/dto"
)

type UserApp interface {
	Login(ctx context.Context, phone, password string) (*dto.UserLogin, error)
	Register(ctx context.Context, user *dto.User) error
	QueryUser(ctx context.Context, user *dto.QueryUserRequest) (*dto.UserInfo, error)
}
