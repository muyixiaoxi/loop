package po

import (
	"gorm.io/gorm"
	"loop_server/internal/model/dto"
)

type FriendShip struct {
	gorm.Model
	UserId   uint `gorm:"comment:用户id;type:bigint;not null;uniqueIndex:idx_user_id_friend_id"`
	FriendId uint `gorm:"comment:好友id;type:bigint;not null;uniqueIndex:idx_user_id_friend_id"`
}

func (f *FriendShip) TableName() string {
	return "friend_ship"
}

func ConvertFriendShipDtoToPo(f *dto.FriendShip) *FriendShip {
	return &FriendShip{
		UserId:   f.UserId,
		FriendId: f.FriendId,
		Model:    gorm.Model{ID: f.ID, CreatedAt: f.CreatedAt, UpdatedAt: f.UpdatedAt},
	}
}

func (f *FriendShip) ConvertToDto() *dto.FriendShip {
	return &dto.FriendShip{
		UserId:    f.UserId,
		FriendId:  f.FriendId,
		ID:        f.ID,
		CreatedAt: f.CreatedAt,
		UpdatedAt: f.UpdatedAt,
	}
}
