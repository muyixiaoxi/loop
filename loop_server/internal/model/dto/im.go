package dto

import (
	"encoding/json"
)

type PrivateMessage struct {
	SeqId          string `json:"seq_id"`          // 唯一标识
	SenderId       uint   `json:"sender_id"`       // 发送者id
	ReceiverId     uint   `json:"receiver_id"`     // 接收者id
	Content        string `json:"content"`         // 消息内容
	Type           int    `json:"type"`            // 消息类型:0-文字，1-图片，2-文件，3-语音，4-视频
	SendTime       int64  `json:"send_time"`       // 发送时间戳
	SenderNickname string `json:"sender_nickname"` // 发送者昵称
	SenderAvatar   string `json:"sender_avatar"`   // 发送者头像
}

type Ack struct {
	SeqId      string `json:"seq_id"`      // 唯一标识
	SenderId   uint   `json:"sender_id"`   // 发送者Id
	ReceiverId uint   `json:"receiver_id"` // 接收者Id
}

type Message struct {
	Cmd   int             `json:"cmd"`
	Token string          `json:"token,omitempty"`
	Data  json.RawMessage `json:"data"`
}
