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
	user.CreatedAt = nil
	user.UpdatedAt = nil
	token, err := jwt.GenToken(user.ID)
	if err != nil {
		return nil, err
	}
	key := redis.GetTokenKey(user.ID)
	err = vars.Redis.Set(ctx, key, token, consts.TokenExpiration).Err()
	if err != nil {
		slog.Error("internal/domain/impl/user_domain_impl.go Login Redis.Set err:", err)
		return nil, err
	}
	user.Password = ""
	return &dto.UserLogin{
		Token: token,
		User:  user,
	}, err
}

// Register 注册
func (u *userDomainImpl) Register(ctx context.Context, user *dto.User) error {
	return u.userRepo.Register(ctx, user)
}

// QueryUser 查询用户信息
func (u *userDomainImpl) QueryUser(ctx context.Context, req *dto.QueryUserRequest) (*dto.User, error) {
	var (
		user *dto.User
		err  error
	)
	if req.UserId != 0 {
		user, err = u.userRepo.QueryById(ctx, req.UserId)
	}
	if req.Phone != "" {
		user, err = u.userRepo.QueryByPhone(ctx, req.Phone)
	}
	return user, err
}

func (u *userDomainImpl) UpdateUser(ctx context.Context, user *dto.User) error {
	return u.userRepo.UpdateUser(ctx, user)
}

func (u *userDomainImpl) UpdateUserPassword(ctx context.Context, userId uint, password string) error {
	return u.userRepo.UpdateUserPassword(ctx, userId, password)
}

func (u *userDomainImpl) GetUserListByUserIds(ctx context.Context, userIds []uint) ([]*dto.User, error) {
	if len(userIds) == 0 {
		return nil, nil
	}
	return u.userRepo.GetUserListByUserIds(ctx, userIds)
}
