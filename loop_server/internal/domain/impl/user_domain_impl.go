package impl

import (
	"context"
	"log/slog"

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

	// 生成双 token
	accessToken, refreshToken, err := jwt.GenerateTokens(user.ID)
	if err != nil {
		return nil, err
	}

	accessKey := redis.GetAccessTokenKey(user.ID)
	refreshKey := redis.GetRefreshTokenKey(user.ID)

	// 使用 pipeline 批量操作
	pipe := vars.Redis.Pipeline()
	pipe.Set(ctx, accessKey, accessToken, jwt.AccessTokenExpire)
	pipe.Set(ctx, refreshKey, refreshToken, jwt.RefreshTokenExpire)
	if _, err := pipe.Exec(ctx); err != nil {
		slog.Error("redis pipe exec err:", err)
		return nil, err
	}

	// 清理敏感数据
	user.CreatedAt = nil
	user.UpdatedAt = nil
	user.Password = ""

	return &dto.UserLogin{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
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
