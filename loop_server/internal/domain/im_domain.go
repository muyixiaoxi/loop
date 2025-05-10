package domain

import (
	"context"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/po"
)

type ImDomain interface {
	IsOnline(ctx context.Context, userId uint) bool
	HandleHeartbeat(ctx context.Context, curUserId uint, msgByte []byte) error
	HandleOnlinePrivateMessage(ctx context.Context, pMsg *dto.PrivateMessage) error
	HandleOfflinePrivateMessage(ctx context.Context, pMsg *dto.PrivateMessage) error
	HandleAck(ctx context.Context, ack *dto.Ack) error
	SendAck(ctx context.Context, ack *dto.Ack) error
	SendGroupMessage(ctx context.Context, pMsg *dto.GroupMessage, userIds []uint) error
	GetOfflinePrivateMessage(ctx context.Context, userId uint) ([]*dto.Message, error)
	GetOfflineGroupMessage(ctx context.Context, groupIds []uint, userId uint) ([]*po.GroupMessage, error)
	SendMessage(ctx context.Context, cmd int, receiverId uint, data any) error
	SaveGroupMessage(ctx context.Context, pMsg *po.GroupMessage) error
	GetGroupMessageBySeqId(ctx context.Context, seqId string) (*po.GroupMessage, error)
	DeleteOfflinePrivateMessage(ctx context.Context, userId uint, messages []*dto.Message) error
	HandleOfflineGroupMessage(ctx context.Context, acks []*dto.Ack) error
}
