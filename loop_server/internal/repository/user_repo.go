package repository

import (
	"context"
	"loop_server/internal/model/dto"
)

type UserRepo interface {
	Register(ctx context.Context, user *dto.User) error
	QueryByPhone(ctx context.Context, phone string) (*dto.User, error)
	QueryById(ctx context.Context, id uint) (*dto.User, error)
	UpdateUser(ctx context.Context, user *dto.User) error
	UpdateUserPassword(ctx context.Context, id uint, password string) error
	GetUserListByUserIds(ctx context.Context, userIds []uint) ([]*dto.User, error)
}
