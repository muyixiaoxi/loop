package domain

import (
	"context"
	"loop_server/internal/model/dto"
)

type UserDomain interface {
	Login(ctx context.Context, phone, password string) (*dto.UserLogin, error)
	Register(ctx context.Context, user *dto.User) error
	QueryUser(ctx context.Context, param *dto.QueryUserRequest) (*dto.User, error)
	UpdateUser(ctx context.Context, user *dto.User) error
	UpdateUserPassword(ctx context.Context, userId uint, password string) error
	GetUserListByUserIds(ctx context.Context, userIds []uint) ([]*dto.User, error)
}
