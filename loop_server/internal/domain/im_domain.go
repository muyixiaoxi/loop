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
}
