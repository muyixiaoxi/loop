package impl

import (
	"context"
	"log/slog"
	"loop_server/infra/consts"
	"loop_server/infra/redis"
	"loop_server/infra/vars"
	"loop_server/internal/model/dto"
	"loop_server/internal/repository"
	"loop_server/pkg/bcrypt"
	"loop_server/pkg/jwt"
)

type userDomainImpl struct {
	userRepo repository.UserRepo
}

func NewUserDomainImpl(userRepo repository.UserRepo) *userDomainImpl {
	return &userDomainImpl{userRepo: userRepo}
}

// Login 登录
func (u *userDomainImpl) Login(ctx context.Context, phone, password string) (*dto.UserLogin, error) {
	user, err := u.userRepo.QueryByPhone(ctx, phone)
	if err != nil || user.ID == 0 || !bcrypt.ComparePassword(user.Password, password) {
		return nil, err
	}

	token, err := jwt.GenToken(user.ID)
	if err != nil {
		return nil, err
	}
	key := redis.GetTokenKey(ctx, user.ID)
	err = vars.Redis.Set(ctx, key, token, consts.TokenExpiration).Err()
	if err != nil {
		slog.Error("internal/domain/impl/user_domain_impl.go Login Redis.Set err:", err)
	}
	return &dto.UserLogin{
		Token:    token,
		Avatar:   user.Avatar,
		Nickname: user.Nickname,
	}, err
}

// Register 注册
func (u *userDomainImpl) Register(ctx context.Context, user *dto.User) error {
	return u.userRepo.Create(ctx, user)
}
