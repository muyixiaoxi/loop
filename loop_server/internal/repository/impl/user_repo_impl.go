package impl

import (
	"context"
	"gorm.io/gorm"
	"log/slog"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/po"
	"loop_server/pkg/bcrypt"
)

type userRepoImpl struct {
	db *gorm.DB
}

func NewUserRepoImpl(db *gorm.DB) *userRepoImpl {
	return &userRepoImpl{db}
}

func (u *userRepoImpl) Register(ctx context.Context, us *dto.User) error {
	user := po.ConvertUserDtoToPo(us)
	tx := u.db.WithContext(ctx)
	err := tx.Create(user).Error
	if err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go Create error", err)
		tx.Rollback()
		return err
	}

	err = tx.Create(&po.FriendShip{
		UserId:   user.ID,
		FriendId: user.ID,
	}).Error
	if err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go Create FriendShip error", err)
		tx.Rollback()
		return err
	}

	return err
}

func (u *userRepoImpl) QueryByPhone(ctx context.Context, phone string) (*dto.User, error) {
	data := &po.User{}
	err := u.db.Where("phone = ?", phone).Find(data).Error
	if err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go QueryByPhone error", err)
		return nil, err
	}

	return data.ConvertToDto(), err
}

func (u *userRepoImpl) QueryById(ctx context.Context, id uint) (*dto.User, error) {
	data := &po.User{}
	err := u.db.Where("id = ?", id).Find(data).Error
	if err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go QueryById error", err)
		return nil, err
	}

	return data.ConvertToDto(), err
}

func (u *userRepoImpl) UpdateUser(ctx context.Context, user *dto.User) error {
	updates := map[string]interface{}{
		"nickname":  user.Nickname,
		"avatar":    user.Avatar,
		"signature": user.Signature,
		"gender":    user.Gender,
		"age":       user.Age,
	}
	if err := u.db.WithContext(ctx).Model(&po.User{}).Where("id = ?", user.ID).Updates(updates).Error; err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go UpdateUser error", err)
		return err
	}
	return nil
}

func (u *userRepoImpl) UpdateUserPassword(ctx context.Context, id uint, password string) error {
	pwd, err := bcrypt.GenerateFromPassword(password)
	if err != nil {
		return err
	}

	if err := u.db.WithContext(ctx).Model(&po.User{}).Where("id = ?", id).Update("password", pwd).Error; err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go UpdateUserPassword error", err)
		return err
	}
	return nil
}

func (u *userRepoImpl) GetUserListByUserIds(ctx context.Context, userIds []uint) ([]*dto.User, error) {
	var data []*po.User
	err := u.db.WithContext(ctx).Where("id in ?", userIds).Find(&data).Error
	if err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go GetUserListByUserIds error", err)
		return nil, err
	}
	return po.BatchConvertUserPoToDto(data), nil
}
