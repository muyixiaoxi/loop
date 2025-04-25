package impl

import (
	"context"
	"encoding/json"
	redis2 "github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
	"log/slog"
	"loop_server/infra/consts"
	"loop_server/infra/redis"
	"loop_server/infra/vars"
	"loop_server/internal/model/dto"
)

type imDomainImpl struct {
}

func NewImDomainImpl() *imDomainImpl {
	return &imDomainImpl{}
}

func (i *imDomainImpl) IsOnline(ctx context.Context, userId uint) bool {
	is, _ := vars.Redis.SIsMember(ctx, redis.GetOnlineUserKey(), userId).Result()
	return is
}

func (i *imDomainImpl) HandleHeartbeat(ctx context.Context, curUserId uint, msgByte []byte) error {
	if err := vars.Ws.Get(curUserId).Conn.WriteMessage(websocket.TextMessage, msgByte); err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go HandleHeartbeat write message err:", err)
		return err
	}
	return nil
}

func (i *imDomainImpl) HandleOnlinePrivateMessage(ctx context.Context, pMsg *dto.PrivateMessage) error {
	pMsgByte, err := json.Marshal(pMsg)
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go json.Marshal(pMsg) err:", err)
		return err
	}

	msg := &dto.Message{
		Cmd:  consts.WsMessageCmdPrivateMessage,
		Data: pMsgByte,
	}
	msgByte, err := json.Marshal(msg)
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go json.Marshal(msg) err:", err)
		return err
	}

	err = vars.Ws.Get(pMsg.ReceiverId).Conn.WriteMessage(websocket.TextMessage, msgByte)
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go HandleOnlinePrivateMessage write message err:", err)
		return err
	}
	return nil
}

func (i *imDomainImpl) HandleOfflinePrivateMessage(ctx context.Context, pMsg *dto.PrivateMessage) error {
	pMsgByte, err := json.Marshal(pMsg)
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go json.Marshal(pMsg) err:", err)
		return err
	}
	msg := &dto.Message{
		Cmd:  consts.WsMessageCmdPrivateMessage,
		Data: pMsgByte,
	}
	msgByte, err := json.Marshal(msg)
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go json.Marshal(msg) err:", err)
		return err
	}

	vars.Redis.ZAdd(ctx, redis.GetUserChatKey(pMsg.ReceiverId), &redis2.Z{
		Score:  float64(pMsg.SendTime),
		Member: msgByte,
	})

	return nil
}

func (i *imDomainImpl) HandleAck(ctx context.Context, ack *dto.Ack) error {
	ackByte, err := json.Marshal(ack)
	if err != nil {
		slog.Error("imDomainImpl json.Marshal(pMsg) err:", err)
		return err
	}
	msg := &dto.Message{Cmd: consts.WsMessageCmdAck, Data: ackByte}
	msgByte, _ := json.Marshal(msg)
	err = vars.Ws.Get(ack.ReceiverId).Conn.WriteMessage(websocket.TextMessage, msgByte)
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go HandleOnlinePrivateMessage write message err:", err)
		return err
	}
	return nil
}
