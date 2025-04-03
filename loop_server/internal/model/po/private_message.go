package po

import "gorm.io/gorm"

type PrivateMessage struct {
	gorm.Model
	SeqId      uint   `gorm:"not null;comment:消息序列号"`
	SenderId   uint   `gorm:"not null;comment:发送者id"`
	ReceiverId uint   `gorm:"not null;comment:接收者id"`
	Content    string `gorm:"not null;comment:消息内容;type:text"`
	Type       int    `gorm:"not null;comment:消息类型:0-文字，1-图片，2-文件，3-语音，4-视频"`
	Status     int    `gorm:"not null;comment:消息状态:0-未读，1-已读"`
}

func (m *PrivateMessage) TableName() string {
	return "message"
}
