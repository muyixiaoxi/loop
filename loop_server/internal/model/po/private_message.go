package po

import "time"

type PrivateMessage struct {
	SeqId      string    `json:"seq_id"`      // 唯一标识
	SenderId   uint      `json:"sender_id"`   // 发送者id
	ReceiverId uint      `json:"receiver_id"` // 接收者id
	Content    string    `json:"content"`     // 消息内容
	Type       int       `json:"type"`        // 消息类型:0-文字，1-图片，2-文件，3-语音，4-视频
	SendTime   time.Time `json:"send_time"`   // 发送时间
}
