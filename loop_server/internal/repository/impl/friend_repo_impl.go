package impl

import (
	"context"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"log/slog"
	"loop_server/infra/consts"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/po"
)

type friendRepoImpl struct {
	db *gorm.DB
}

func NewFriendRepoImpl(db *gorm.DB) *friendRepoImpl {
	return &friendRepoImpl{db: db}
}

func (u *friendRepoImpl) SaveOrUpdateFriendRequest(ctx context.Context, req *dto.FriendRequest) error {
	friend := po.ConvertFriendRequestDtoToPo(req)

	err := u.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "requester_id"}, {Name: "recipient_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"status", "message"}),
	}).Create(friend).Error
	if err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go AddFriend error", err)
	}
	return err
}

func (u *friendRepoImpl) UpdateFriendRequest(ctx context.Context, req *dto.FriendRequest) error {
	data := po.ConvertFriendRequestDtoToPo(req)
	if req.Status == consts.FriendRequestStatusAgree {
		tx := u.db.Begin()
		err := tx.Where("requester_id = ? and recipient_id = ? and status = 0", req.RequesterId, req.RecipientId).Updates(data).Error
		if err != nil {
			slog.Error("internal/repository/impl/user_repo_impl.go UpdateFriendRequest error", err)
			tx.Rollback()
			return err
		}

		err = u.creteFriendShip(ctx, tx, &po.FriendShip{UserId: req.RequesterId, FriendId: req.RecipientId})
		if err != nil {
			tx.Rollback()
			return err
		}
		err = u.creteFriendShip(ctx, tx, &po.FriendShip{UserId: req.RecipientId, FriendId: req.RequesterId})
		if err != nil {
			tx.Rollback()
			return err
		}
		tx.Commit()
		return nil
	}

	err := u.db.Where("requester_id = ? and recipient_id = ? and status = 0", req.RequesterId, req.RecipientId).Updates(data).Error
	if err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go UpdateFriendRequest error", err)
	}
	return err
}

func (u *friendRepoImpl) creteFriendShip(ctx context.Context, tx *gorm.DB, ship *po.FriendShip) error {
	err := tx.Create(ship).Error
	if err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go creteFriendShip error", err)
	}
	return err
}

func (u *friendRepoImpl) QueryFriendShip(ctx context.Context, userId, friendId uint) (*dto.FriendShip, error) {
	data := &po.FriendShip{}
	err := u.db.Where("user_id = ? AND friend_id = ?", userId, friendId).Find(data).Error
	if err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go QueryFriendShip error", err)
		return nil, err
	}

	return data.ConvertToDto(), err
}

func (u *friendRepoImpl) GetFriendRequestListByRequesterIdOrRecipientId(ctx context.Context, id uint) ([]*dto.FriendRequest, error) {
	var data []*po.FriendRequest
	err := u.db.Where("requester_id = ? or recipient_id = ?", id, id).Order("created_at desc").Find(&data).Error
	if err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go GetFriendRequestListByRequesterIdOrRecipientId error", err)
		return nil, err
	}
	return po.BatchConvertFriendRequestPoToDto(data), nil
}

func (u *friendRepoImpl) GetFriendListByUserId(ctx context.Context, userId uint) ([]*dto.User, error) {
	var data []*po.User
	err := u.db.Select("user.id", "nickname", "avatar", "signature", "gender", "age").Joins("join friend_ship on user.id = friend_ship.friend_id").Where("user_id = ?", userId).
		Find(&data).Error
	if err != nil {
		slog.Error("internal/repository/impl/user_repo_impl.go GetFriendListByUserId error", err)
		return nil, err
	}
	return po.BatchConvertUserPoToDto(data), nil
}

func (u *friendRepoImpl) IsFriend(ctx context.Context, userId uint, friendId uint) (bool, error) {
	var data []*po.FriendShip
	err := u.db.Where("user_id = ? AND friend_id = ?", userId, friendId).Find(&data).Error
	if err != nil {
		slog.Error("internal/repository/impl/friend_repo_impl.go IsFriend error", err)
		return false, err
	}
	return len(data) > 0, nil
}

func (u *friendRepoImpl) DeleteFriend(ctx context.Context, userId uint, friendId uint) error {
	err := u.db.WithContext(ctx).Where("user_id = ? AND friend_id = ?", userId, friendId).Delete(&po.FriendShip{}).Error
	if err != nil {
		slog.Error("internal/repository/impl/friend_repo_impl.go DeleteFriend error", err)
	}
	return err
}
