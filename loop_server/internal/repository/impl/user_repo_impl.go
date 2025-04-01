package impl

import (
	"context"
	"gorm.io/gorm"
	"log/slog"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/po"
)

type userRepoImpl struct {
	db *gorm.DB
}

func NewUserRepoImpl(db *gorm.DB) *userRepoImpl {
	return &userRepoImpl{db}
}

func (u *userRepoImpl) Create(ctx context.Context, us *dto.User) error {
	user := po.ConvertUserDtoToPo(us)
	err := u.db.Create(user).Error
	if err != nil {
		slog.Error("dao/user.go Register error", err)
	}
	return err
}

func (u *userRepoImpl) QueryByPhone(ctx context.Context, phone string) (*dto.User, error) {
	data := &po.User{}
	err := u.db.Where("phone = ?", phone).Find(data).Error
	if err != nil {
		slog.Error("dao/user.go QueryByPhoneAndPassword error", err)
		return nil, err
	}

	return data.ConvertDto(), err
}
