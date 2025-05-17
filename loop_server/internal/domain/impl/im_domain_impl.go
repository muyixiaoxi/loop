package impl

import (
	"context"
	"encoding/json"
	"fmt"
	redis2 "github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
	"log/slog"
	"loop_server/infra/consts"
	"loop_server/infra/redis"
	"loop_server/infra/vars"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/po"
	"loop_server/internal/repository"
	"time"
)

type imDomainImpl struct {
	imRepo repository.ImRepo
}

func NewImDomainImpl(imRepo repository.ImRepo) *imDomainImpl {
	return &imDomainImpl{imRepo: imRepo}
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
	if ack.IsGroup {
		return i.groupAck(ctx, ack)
	}
	return i.SendAck(ctx, ack)
}

func (i *imDomainImpl) groupAck(ctx context.Context, ack *dto.Ack) error {
	listKey := redis.GetGroupAckListKey(ack.SenderId, ack.ReceiverId)
	hashKey := redis.GetGroupAckStatusKey(ack.SenderId, ack.ReceiverId)

	// Lua脚本实现原子操作
	script := `
        -- 设置ACK状态
        redis.call('HSET', KEYS[2], ARGV[1], 'acknowledged')
        
        local lastAckSeqId = nil
        
        -- 检查并移除已确认的队头消息
        while true do
            local seqId = redis.call('LINDEX', KEYS[1], 0)
            if not seqId then
                break
            end
            
            local status = redis.call('HGET', KEYS[2], seqId)
            if status == 'acknowledged' then
                redis.call('LPOP', KEYS[1])
                redis.call('HDEL', KEYS[2], seqId)
                lastAckSeqId = seqId
            else
                break
            end
        end
        
        return lastAckSeqId or ""
    `

	// 执行Lua脚本
	result, err := vars.Redis.Eval(ctx, script, []string{listKey, hashKey}, ack.SeqId).Result()
	if err != nil {
		return err
	}

	// 如果有最后确认的seqId，更新数据库
	if lastAckSeqId, ok := result.(string); ok && lastAckSeqId != "" {
		return i.imRepo.UpdateGroupMessageLastSeqId(ctx, ack.ReceiverId, ack.SenderId, lastAckSeqId)
	}

	return nil
}

func (i *imDomainImpl) SendAck(ctx context.Context, ack *dto.Ack) error {
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

func (i *imDomainImpl) SendGroupMessage(ctx context.Context, pMsg *dto.GroupMessage, userIds []uint) error {
	pMsgByte, err := json.Marshal(pMsg)
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go json.Marshal(pMsg) err:", err)
		return err
	}
	msg := &dto.Message{
		Cmd:  consts.WsMessageCmdGroupMessage,
		Data: pMsgByte,
	}
	msgByte, err := json.Marshal(msg)
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go json.Marshal(msg) err:", err)
		return err
	}
	if err != nil {
		return err
	}
	for _, userId := range userIds {
		if userId == pMsg.SenderId {
			continue
		}
		if vars.Ws.Get(userId) != nil {
			i.sendGroupMessage(ctx, userId, pMsg.ReceiverId, pMsg.SeqId, msgByte, 3)
		}
	}
	return nil
}

func (i *imDomainImpl) sendGroupMessage(ctx context.Context, userId uint, receiverId uint, seqId string, msgByte []byte, replay int) (err error) {
	if replay < 0 {
		return nil
	}
	defer func() {
		if err != nil {
			time.Sleep(time.Second * 1)
			i.sendGroupMessage(ctx, userId, receiverId, seqId, msgByte, replay-1)
		}
	}()

	// 将消息追加到列表尾部
	err = vars.Redis.RPush(ctx, redis.GetGroupAckListKey(userId, receiverId), seqId).Err()
	if err != nil {
		fmt.Println(err)
		slog.Error("internal/domain/impl/im_domain_impl.go SendGroupMessage redis rpush err:", err)
		return err
	}
	// 自动过期
	vars.Redis.ExpireAt(ctx, redis.GetGroupAckListKey(userId, receiverId), time.Now().Add(time.Hour))

	err = vars.Redis.HSet(ctx, redis.GetGroupAckStatusKey(userId, receiverId), seqId, "pending").Err()
	if err != nil {
		fmt.Println(err)
		slog.Error("internal/domain/impl/im_domain_impl.go SendGroupMessage redis hset err:", err)
		return err
	}
	vars.Redis.ExpireAt(ctx, redis.GetGroupAckStatusKey(userId, receiverId), time.Now().Add(time.Hour))

	err = vars.Ws.Get(userId).Conn.WriteMessage(websocket.TextMessage, msgByte)
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go HandleOnlinePrivateMessage write message err:", err)
		return err
	}

	go i.ackListener(ctx, userId, receiverId, seqId, msgByte, replay)
	return nil
}

func (i *imDomainImpl) ackListener(ctx context.Context, userId uint, receiverId uint, seqId string, msgByte []byte, replay int) {
	time.Sleep(time.Second * 1)
	status, err := vars.Redis.HGet(ctx, redis.GetGroupAckStatusKey(userId, receiverId), seqId).Result()
	if err == redis2.Nil {
		return
	}
	if err != nil {
		return
	}
	if status == consts.WsMessageAckStatePending {
		i.sendGroupMessage(ctx, userId, receiverId, seqId, msgByte, replay-1)
	}
}

func (i *imDomainImpl) saveOfflineGroupMessage(ctx context.Context, userIdList []uint, seqId string) error {
	offline := &dto.GroupOfflineMessage{
		SeqId: seqId,
	}
	offlineByte, err := json.Marshal(offline)
	if err != nil {
		return err
	}
	message := &dto.Message{
		Cmd:  consts.WsMessageCmdGroupMessage,
		Data: offlineByte,
	}
	messageByte, err := json.Marshal(message)
	if err != nil {
		return err
	}
	for _, id := range userIdList {
		vars.Redis.ZAdd(ctx, redis.GetUserChatKey(id), &redis2.Z{
			Score:  float64(time.Now().Unix()),
			Member: messageByte,
		})
	}
	return nil
}

func (i *imDomainImpl) GetOfflinePrivateMessage(ctx context.Context, userId uint) ([]*dto.Message, error) {
	members, err := vars.Redis.ZRange(ctx, redis.GetUserChatKey(userId), 0, -1).Result()
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go GetOfflineMessage redis zrange err:", err)
		return nil, err
	}
	messages := make([]*dto.Message, 0, len(members))
	for _, member := range members {
		message := &dto.Message{}
		json.Unmarshal([]byte(member), message)
		messages = append(messages, message)
	}
	return messages, nil
}

func (i *imDomainImpl) GetOfflineGroupMessage(ctx context.Context, groupIds []uint, userId uint) ([]*po.GroupMessage, error) {
	data := make([]*po.GroupMessage, 0)
	for _, id := range groupIds {
		tmp, err := i.imRepo.GetOfflineGroupMessage(ctx, id, userId)
		if err != nil {
			return nil, err
		}
		data = append(data, tmp...)
	}
	return data, nil
}

func (i *imDomainImpl) SendMessage(ctx context.Context, cmd int, receiverId uint, data any) error {
	dataByte, err := json.Marshal(data)
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go json.Marshal(data) err:", err)
		return err
	}
	msgByte, err := json.Marshal(dto.Message{Cmd: cmd, Data: dataByte})
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go json.Marshal(msg) err:", err)
		return err
	}
	return vars.Ws.SendMessage(receiverId, msgByte)
}

func (i *imDomainImpl) DeleteOfflinePrivateMessage(ctx context.Context, userId uint, messages []*dto.Message) error {
	if len(messages) == 0 {
		return nil
	}
	members := make([]interface{}, 0, len(messages))
	for _, message := range messages {
		msgByte, _ := json.Marshal(message)
		members = append(members, string(msgByte))
	}
	_, err := vars.Redis.ZRem(ctx, redis.GetUserChatKey(userId), members...).Result()
	if err != nil {
		slog.Error("internal/domain/impl/im_domain_impl.go DeleteOfflineMessage redis zrange err:", err)
		return err
	}

	return nil
}

func (i *imDomainImpl) SaveGroupMessage(ctx context.Context, message *po.GroupMessage) error {
	return i.imRepo.SaveGroupMessage(ctx, message)
}

func (i *imDomainImpl) GetGroupMessageBySeqId(ctx context.Context, seqId string) (*po.GroupMessage, error) {
	return i.imRepo.GetGroupMessageBySeqId(ctx, seqId)
}

func (i *imDomainImpl) HandleOfflineGroupMessage(ctx context.Context, acks []*dto.Ack) error {
	for _, ack := range acks {
		err := i.imRepo.UpdateGroupMessageLastSeqId(ctx, ack.ReceiverId, ack.SenderId, ack.SeqId)
		if err != nil {
			return err
		}
	}
	return nil
}
