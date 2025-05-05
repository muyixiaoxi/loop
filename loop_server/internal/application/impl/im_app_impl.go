package impl

import (
	"context"
	"encoding/json"
	"log/slog"
	"loop_server/infra/consts"
	"loop_server/infra/redis"
	"loop_server/infra/vars"
	"loop_server/infra/ws"
	"loop_server/internal/application"
	"loop_server/internal/domain"
	"loop_server/internal/model/dto"
)

type imAppImpl struct {
	sfuApp      application.SfuAPP
	imDomain    domain.ImDomain
	groupDomain domain.GroupDomain
}

func NewImAppImpl(sfuApp application.SfuAPP, imDomain domain.ImDomain, groupDomain domain.GroupDomain) *imAppImpl {
	return &imAppImpl{sfuApp: sfuApp, imDomain: imDomain, groupDomain: groupDomain}
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
		return i.handlerGroupMessage(ctx, msg)
	case consts.WsMessageCmdPrivateOffer:
	case consts.WsMessageCmdPrivateAnswer:
	case consts.WsMessageCmdPrivateIce:
	case consts.WsMessageCmdGroupInitiatorOffer:
		return i.handlerGroupOffer(ctx, msg)
	case consts.WsMessageCmdGroupIce:
		return i.handlerGroupIce(ctx, msg)
	}
	return nil
}

func (i *imAppImpl) handlerGroupMessage(ctx context.Context, msg *dto.Message) error {
	gMsg := &dto.GroupMessage{}
	json.Unmarshal(msg.Data, gMsg)
	if gMsg.SeqId == "" || gMsg.ReceiverId == 0 {
		return nil
	}
	// 群信息
	group, err := i.groupDomain.GetGroupById(ctx, gMsg.ReceiverId)
	if err != nil {
		return err
	}
	gMsg.GroupName = group.Name
	gMsg.GroupAvatar = group.Avatar

	// 获取群用户id
	userIds, err := i.groupDomain.GetGroupUserId(ctx, gMsg.ReceiverId)
	if err != nil {
		return err
	}
	if err := i.imDomain.HandleGroupMessage(ctx, gMsg, userIds); err != nil {
		return err
	}

	return i.imDomain.HandleAck(ctx, &dto.Ack{
		SeqId:      gMsg.SeqId,
		SenderId:   gMsg.ReceiverId,
		ReceiverId: gMsg.SenderId,
		IsGroup:    consts.AckGroupMessage,
	})
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

func (i *imAppImpl) GetOfflineMessage(ctx context.Context, userId uint) ([]*dto.Message, error) {
	return i.imDomain.GetOfflineMessage(ctx, userId)
}

func (i *imAppImpl) handlerGroupOffer(ctx context.Context, msg *dto.Message) error {
	var sdpMessage dto.WebRTCMessage
	err := json.Unmarshal(msg.Data, &sdpMessage)
	if err != nil {
		slog.Error("handlerGroupOffer unmarshal err:", err)
		return err
	}
	userId := sdpMessage.SenderId
	answer, err := i.sfuApp.SetOfferGetAnswer(ctx, sdpMessage.ReceiverId, sdpMessage.SenderNickname, sdpMessage.SenderAvatar,
		sdpMessage.ReceiverIdList, sdpMessage.ReceiverAvatarList, sdpMessage.MediaType, sdpMessage.SessionDescription)
	if err != nil {
		return err
	}

	sdpMessage.SenderId, sdpMessage.ReceiverId = sdpMessage.ReceiverId, sdpMessage.SenderId
	sdpMessage.SessionDescription = answer
	return i.imDomain.SendMessage(ctx, consts.WsMessageCmdGroupAnswer, userId, sdpMessage)
}

func (i *imAppImpl) handlerGroupIce(ctx context.Context, msg *dto.Message) error {
	var sdpMessage dto.WebRTCMessage
	err := json.Unmarshal(msg.Data, &sdpMessage)
	if err != nil {
		slog.Error("handlerGroupOffer unmarshal err:", err)
		return err
	}
	return i.sfuApp.SetIceCandidateInit(ctx, sdpMessage.ReceiverId, sdpMessage.SenderNickname, sdpMessage.SenderAvatar,
		sdpMessage.ReceiverIdList, sdpMessage.ReceiverAvatarList, sdpMessage.MediaType, sdpMessage.CandidateInit)
}
