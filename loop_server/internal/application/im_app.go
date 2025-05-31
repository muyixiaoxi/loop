package application

import (
	"context"
	"loop_server/infra/ws"
	"loop_server/internal/model/dto"
)

type ImApp interface {
	AddOnlineUser(ctx context.Context, client *ws.Client) error
	RemoveOnlineUser(ctx context.Context, userId uint) error
	HandleMessage(ctx context.Context, curUserId uint, msgByte []byte) error
	GetOfflineMessage(ctx context.Context, userId uint) ([]*dto.Message, error)
	SubmitOfflineMessage(ctx context.Context, userId uint, seqIdList []*dto.Ack) error
}
