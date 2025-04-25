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
	case consts.WsMessageCmdAck:
		return i.handlerAck(ctx, msg)
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

	return i.handleOfflinePrivateMessage(ctx, pMsg)
}

// handleOfflinePrivateMessage 收到离线消息
func (i *imAppImpl) handleOfflinePrivateMessage(ctx context.Context, message *dto.PrivateMessage) error {
	if err := i.imDomain.HandleOfflinePrivateMessage(ctx, message); err != nil {
		return err
	}
	return i.imDomain.HandleAck(ctx, &dto.Ack{
		SeqId:      message.SeqId,
		SenderId:   message.ReceiverId,
		ReceiverId: message.SenderId,
	})
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

func (i *imAppImpl) handlerAck(ctx context.Context, msg *dto.Message) error {
	ack := &dto.Ack{}
	if err := json.Unmarshal(msg.Data, ack); err != nil {
		slog.Error("imAppImpl.handlerAck ack unmarshal err:", err)
		return err
	}
	return i.imDomain.HandleAck(ctx, ack)
}
