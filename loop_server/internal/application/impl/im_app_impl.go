package impl

import (
	"context"
	"encoding/json"
	"github.com/gorilla/websocket"
	"log/slog"
	"loop_server/infra/consts"
	"loop_server/infra/vars"
	"loop_server/internal/model/dto"
	"loop_server/pkg/request"
)

type imAppImpl struct {
}

func NewImAppImpl() *imAppImpl {
	return &imAppImpl{}
}

func (i *imAppImpl) HandleMessage(ctx context.Context, msgByte []byte) error {
	msg := &dto.Message{}
	if err := json.Unmarshal(msgByte, msg); err != nil {
		slog.Error("message unmarshal err:", err)
		return err
	}
	switch msg.Cmd {
	case consts.WsMessageCmdHeartbeat:
		return i.handleHeartbeat(ctx, msgByte)
	case consts.WsMessageCmdPrivateMessage:
	case consts.WsMessageCmdGroupMessage:
	}
	return nil
}

func (i *imAppImpl) handleHeartbeat(ctx context.Context, msgByte []byte) error {
	if err := vars.Ws.Clients[request.GetCurrentUser(ctx)].Conn.WriteMessage(websocket.TextMessage, msgByte); err != nil {
		slog.Error("write message err:", err)
		return err
	}
	return nil
}

func (i *imAppImpl) handlePrivateMessage(ctx context.Context) error {
	// todo
	return nil
}
