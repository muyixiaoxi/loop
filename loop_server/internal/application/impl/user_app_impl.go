package impl

import (
	"context"
	"loop_server/infra/middleware"
	"loop_server/internal/domain"
	"loop_server/internal/model/dto"
	"loop_server/pkg/bcrypt"
	"loop_server/pkg/request"
)

type userAppImpl struct {
	userDomain   domain.UserDomain
	friendDomain domain.FriendDomain
}

func NewUserAppImpl(userDomain domain.UserDomain, friendDomain domain.FriendDomain) *userAppImpl {
	return &userAppImpl{
		userDomain:   userDomain,
		friendDomain: friendDomain,
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

func (u *userAppImpl) QueryUser(ctx context.Context, param *dto.QueryUserRequest) (*dto.UserInfo, error) {
	user, err := u.userDomain.QueryUser(ctx, param)
	if err != nil || user == nil || user.ID == 0 {
		return nil, err
	}
	isFriend, err := u.friendDomain.IsFriend(ctx, request.GetCurrentUser(ctx), user.ID)
	if err != nil {
		return nil, err
	}
	return &dto.UserInfo{
		Id:        user.ID,
		Nickname:  user.Nickname,
		Avatar:    user.Avatar,
		IsFriend:  isFriend,
		Signature: user.Signature,
		Gender:    user.Gender,
		Age:       user.Age,
	}, nil
}

func (u *userAppImpl) UpdateUserInfo(ctx context.Context, user *dto.User) (*dto.User, error) {
	err := u.userDomain.UpdateUser(ctx, user)
	if err != nil {
		return nil, err
	}
	user, err = u.userDomain.QueryUser(ctx, &dto.QueryUserRequest{UserId: user.ID})
	if err != nil {
		return nil, err
	}
	user.Password = ""
	return user, err
}

func (u *userAppImpl) UpdateUserPassword(ctx context.Context, old string, new string) (bool, error) {
	user, err := u.userDomain.QueryUser(ctx, &dto.QueryUserRequest{UserId: request.GetCurrentUser(ctx)})
	if err != nil {
		return false, err
	}
	if !bcrypt.ComparePassword(user.Password, old) {
		return false, nil
	}
	err = u.userDomain.UpdateUserPassword(ctx, user.ID, new)
	if err != nil {
		return false, err
	}
	return true, nil
}

func (u *userAppImpl) RefreshToken(ctx context.Context, refreshToken string) (string, error) {
	accessToken, err := middleware.TryRefreshToken(ctx, refreshToken)
	if err != nil {
		return "", err
	}
	return accessToken, nil
}
