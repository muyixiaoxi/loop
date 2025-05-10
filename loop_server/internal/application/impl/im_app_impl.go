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
	"loop_server/internal/model/po"
	"strings"
)

type imAppImpl struct {
	sfuApp      application.SfuAPP
	imDomain    domain.ImDomain
	groupDomain domain.GroupDomain
	userDomain  domain.UserDomain
}

func NewImAppImpl(sfuApp application.SfuAPP, imDomain domain.ImDomain, groupDomain domain.GroupDomain, userDomain domain.UserDomain) *imAppImpl {
	return &imAppImpl{sfuApp: sfuApp, imDomain: imDomain, groupDomain: groupDomain, userDomain: userDomain}
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

	if err := i.imDomain.SaveGroupMessage(ctx, &po.GroupMessage{
		GroupId:  gMsg.ReceiverId,
		SeqId:    gMsg.SeqId,
		SenderId: gMsg.SenderId,
		Content:  gMsg.Content,
		Type:     gMsg.Type,
		SendTime: gMsg.SendTime,
	}); err != nil {
		if strings.Contains(err.Error(), consts.Duplicate) {
			return i.imDomain.SendAck(ctx, &dto.Ack{
				SeqId:      gMsg.SeqId,
				SenderId:   gMsg.ReceiverId,
				ReceiverId: gMsg.SenderId,
				IsGroup:    consts.AckGroupMessage,
			})
		}
		return err
	}
	// 通知在线用户
	go i.groupMessageInfoOnlineUser(ctx, gMsg)

	return i.imDomain.SendAck(ctx, &dto.Ack{
		SeqId:      gMsg.SeqId,
		SenderId:   gMsg.ReceiverId,
		ReceiverId: gMsg.SenderId,
		IsGroup:    consts.AckGroupMessage,
	})
}

func (i *imAppImpl) groupMessageInfoOnlineUser(ctx context.Context, gMsg *dto.GroupMessage) error {
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
	if err := i.imDomain.SendGroupMessage(ctx, gMsg, userIds); err != nil {
		return err
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

func (i *imAppImpl) GetOfflineMessage(ctx context.Context, userId uint) ([]*dto.Message, error) {
	msg, err := i.imDomain.GetOfflinePrivateMessage(ctx, userId)
	if err != nil {
		return nil, err
	}

	// 获取群消息
	groupMsg, err := i.getOfflineGroupMessage(ctx, userId)
	if err != nil {
		return nil, err
	}
	msg = append(msg, groupMsg...)
	return msg, nil
}

func (i *imAppImpl) getOfflineGroupMessage(ctx context.Context, userId uint) ([]*dto.Message, error) {
	groupList, err := i.groupDomain.GetGroupList(ctx, userId)
	if err != nil {
		return nil, err
	}
	groupIdList := make([]uint, len(groupList))
	groupHash := make(map[uint]*dto.Group, len(groupList))
	for i, group := range groupList {
		groupIdList[i] = group.ID
		groupHash[group.ID] = group
	}
	gmsg, err := i.imDomain.GetOfflineGroupMessage(ctx, groupIdList, userId)
	if err != nil {
		return nil, err
	}
	userIdMap := make(map[uint]*dto.User)
	for _, message := range gmsg {
		userIdMap[message.SenderId] = nil
	}
	userIdList := make([]uint, 0, len(userIdMap))
	for id, _ := range userIdMap {
		userIdList = append(userIdList, id)
	}
	userList, err := i.userDomain.GetUserListByUserIds(ctx, userIdList)
	if err != nil {
		return nil, err
	}
	for _, user := range userList {
		userIdMap[user.ID] = user
	}

	resp := make([]*dto.Message, len(gmsg))
	for _, message := range gmsg {
		data := &dto.GroupMessage{
			SeqId:          message.SeqId,
			SenderId:       message.SenderId,
			ReceiverId:     userId,
			Content:        message.Content,
			Type:           message.Type,
			SendTime:       message.SendTime,
			SenderNickname: userIdMap[message.SenderId].Nickname,
			SenderAvatar:   userIdMap[message.SenderId].Avatar,
			GroupName:      groupHash[message.GroupId].Name,
			GroupAvatar:    groupHash[message.GroupId].Avatar,
		}
		dataByte, _ := json.Marshal(data)
		tmp := &dto.Message{
			Cmd:  consts.WsMessageCmdGroupMessage,
			Data: dataByte,
		}
		resp = append(resp, tmp)
	}
	return resp, nil
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

func (i *imAppImpl) SubmitOfflineMessage(ctx context.Context, userId uint, seqIdList []*dto.Ack) error {
	// 私聊
	used := make(map[string]bool, len(seqIdList))
	groupAck := make([]*dto.Ack, 0)
	for _, s := range seqIdList {
		if !s.IsGroup {
			used[s.SeqId] = true
		} else {
			groupAck = append(groupAck, s)
		}
	}

	messages, err := i.imDomain.GetOfflinePrivateMessage(ctx, userId)
	if err != nil {
		return err
	}

	deleteMessageList := make([]*dto.Message, 0, len(seqIdList))
	for _, message := range messages {
		data := &dto.PrivateMessage{}
		if err := json.Unmarshal(message.Data, data); err != nil {
			return err
		}

		deleteMessageList = append(deleteMessageList, message)
	}
	err = i.imDomain.DeleteOfflinePrivateMessage(ctx, userId, deleteMessageList)
	if err != nil {
		return err
	}

	return i.imDomain.HandleOfflineGroupMessage(ctx, groupAck)
}
