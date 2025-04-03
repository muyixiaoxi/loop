package repository

import (
	"context"
	"loop_server/internal/model/dto"
)

type UserRepo interface {
	Create(ctx context.Context, user *dto.User) error
	QueryByPhone(ctx context.Context, phone string) (*dto.User, error)
	QueryById(ctx context.Context, id uint) (*dto.User, error)
}
