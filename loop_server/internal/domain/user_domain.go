package domain

import (
	"context"
	"loop_server/internal/model/dto"
)

type UserDomain interface {
	Login(ctx context.Context, phone, password string) (*dto.UserLogin, error)
	Register(ctx context.Context, user *dto.User) error
}
