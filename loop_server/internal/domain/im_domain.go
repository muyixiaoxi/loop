package domain

import (
	"context"
	"loop_server/internal/model/dto"
)

type ImDomain interface {
	IsOnline(ctx context.Context, userId uint) bool
	HandleHeartbeat(ctx context.Context, curUserId uint, msgByte []byte) error
	HandleOnlinePrivateMessage(ctx context.Context, pMsg *dto.PrivateMessage) error
	HandleOfflinePrivateMessage(ctx context.Context, pMsg *dto.PrivateMessage) error
	HandleAck(ctx context.Context, ack *dto.Ack) error
	HandleGroupMessage(ctx context.Context, pMsg *dto.GroupMessage, userIds []uint) error
	GetOfflineMessage(ctx context.Context, userId uint) ([]*dto.Message, error)
	SendMessage(ctx context.Context, cmd int, receiverId uint, data any) error
}
