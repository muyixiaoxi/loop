package application

import (
	"context"
	"loop_server/infra/ws"
)

type ImApp interface {
	AddOnlineUser(ctx context.Context, client *ws.Client) error
	RemoveOnlineUser(ctx context.Context, userId uint) error
	HandleMessage(ctx context.Context, curUserId uint, msgByte []byte) error
}
