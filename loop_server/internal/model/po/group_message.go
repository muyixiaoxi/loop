package po

type GroupMessage struct{}

func (g *GroupMessage) TableName() string {
	return "group_message"
}
