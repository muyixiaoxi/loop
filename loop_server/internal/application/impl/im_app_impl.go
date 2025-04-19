package impl

import (
	"context"
	"encoding/json"
	"log/slog"
	"loop_server/infra/consts"
	"loop_server/infra/redis"
	"loop_server/infra/vars"
	"loop_server/infra/ws"
	"loop_server/internal/domain"
	"loop_server/internal/model/dto"
)

type imAppImpl struct {
	imDomain domain.ImDomain
}

func NewImAppImpl(imDomain domain.ImDomain) *imAppImpl {
	return &imAppImpl{imDomain: imDomain}
}

func (i *imAppImpl) HandleMessage(ctx context.Context, curUserId uint, msgByte []byte) error {
	msg := &dto.Message{}
	if err := json.Unmarshal(msgByte, msg); err != nil {
		slog.Error("message unmarshal err:", err)
		return err
	}
	switch msg.Cmd {
	case consts.WsMessageCmdHeartbeat:
		return i.handleHeartbeat(ctx, curUserId, msgByte)
	case consts.WsMessageCmdPrivateMessage:
		return i.handlePrivateMessage(ctx, msg)
	case consts.WsMessageCmdGroupMessage:
	}
	return nil
}

func (i *imAppImpl) handleHeartbeat(ctx context.Context, curUserId uint, msgByte []byte) error {
	return i.imDomain.HandleHeartbeat(ctx, curUserId, msgByte)
}

func (i *imAppImpl) handlePrivateMessage(ctx context.Context, msg *dto.Message) error {
	/*
		A —> B 发送消息：
		1. 在线转发
		2. 不在线，存入消息队列
	*/
	pMsg := &dto.PrivateMessage{}
	json.Unmarshal(msg.Data, pMsg)
	if pMsg.SeqId == "" || pMsg.ReceiverId == 0 {
		return nil
	}

	// 在线
	if i.imDomain.IsOnline(ctx, pMsg.ReceiverId) {
		return i.imDomain.HandleOnlinePrivateMessage(ctx, pMsg)

	}

	return i.imDomain.HandleOfflinePrivateMessage(ctx, pMsg)
}

func (i *imAppImpl) AddOnlineUser(ctx context.Context, client *ws.Client) error {
	if i.imDomain.IsOnline(ctx, client.UserId) {
		i.RemoveOnlineUser(ctx, client.UserId)
	}
	if err := vars.Redis.SAdd(ctx, redis.GetOnlineUserKey(), client.UserId).Err(); err != nil {
		slog.Error("redis set online user err:", err)
		return err
	}

	vars.Ws.Set(client.UserId, client)
	return nil
}

func (i *imAppImpl) RemoveOnlineUser(ctx context.Context, userId uint) error {
	if err := vars.Redis.SRem(ctx, redis.GetOnlineUserKey(), userId).Err(); err != nil {
		slog.Error("redis remove online user err:", err)
		return err
	}
	vars.Ws.Delete(userId)
	return nil
}
