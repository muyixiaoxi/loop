package po

import (
	"gorm.io/gorm"
)

type GroupMessage struct {
	gorm.Model
	GroupId  uint   `gorm:"comment:群id;type:bigint;not null"`                            // 群聊
	SeqId    string `gorm:"comment:唯一标识;type:varchar(64);not null;unique"`               // 唯一标识
	SenderId uint   `gorm:"comment:发送者id;type:bigint;not null"`                          // 发送者id
	Content  string `gorm:"comment:消息内容;type:text;not null"`                             // 消息内容
	Type     int    `gorm:"comment:消息类型:0-文字，1-图片，2-文件，3-语音，4-视频;type:tinyint;not null"` // 消息类型:0-文字，1-图片，2-文件，3-语音，4-视频
	SendTime int64  `gorm:"comment:发送时间;type:bigint;not null"`                           // 发送时间
}

func (g *GroupMessage) TableName() string {
	return "group_message"
}
