package po

type GroupMessage struct {
	SeqId    string `json:"seq_id"`      // 唯一标识
	SenderId uint   `json:"sender_id"`   // 发送者id
	GroupId  uint   `json:"receiver_id"` // 群聊
	Content  string `json:"content"`     // 消息内容
	Type     int    `json:"type"`        // 消息类型:0-文字，1-图片，2-文件，3-语音，4-视频
	SendTime int64  `json:"send_time"`   // 发送时间
}

func (g *GroupMessage) TableName() string {
	return "group_message"
}
