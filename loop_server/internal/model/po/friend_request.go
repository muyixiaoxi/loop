package po

import (
	"gorm.io/gorm"
	"loop_server/internal/model/dto"
)

type FriendRequest struct {
	gorm.Model
	RequesterId uint   `gorm:"comment:请求者ID;not null;uniqueIndex:idx_requester_id_recipient_id"`
	RecipientId uint   `gorm:"comment:接收者ID;not null;uniqueIndex:idx_requester_id_recipient_id"`
	Status      int    `gorm:"comment:状态:0-未处理，1-已同意，2-已拒绝;not null"`
	Message     string `gorm:"comment:验证消息;type:varchar(128);not null"`
}

func (*FriendRequest) TableName() string {
	return "friend_request"
}

func (f *FriendRequest) ConvertToDto() *dto.FriendRequest {
	return &dto.FriendRequest{
		ID:          f.ID,
		CreatedAt:   f.CreatedAt,
		UpdatedAt:   f.UpdatedAt,
		RequesterId: f.RequesterId,
		RecipientId: f.RecipientId,
		Status:      f.Status,
		Message:     f.Message,
	}
}

func BatchConvertFriendRequestPoToDto(data []*FriendRequest) []*dto.FriendRequest {
	list := make([]*dto.FriendRequest, len(data))
	for i, datum := range data {
		list[i] = datum.ConvertToDto()
	}
	return list
}

func ConvertFriendRequestDtoToPo(req *dto.FriendRequest) *FriendRequest {
	return &FriendRequest{
		Model:       gorm.Model{ID: req.ID, CreatedAt: req.CreatedAt, UpdatedAt: req.UpdatedAt},
		RequesterId: req.RequesterId,
		RecipientId: req.RecipientId,
		Status:      req.Status,
		Message:     req.Message,
	}
}
