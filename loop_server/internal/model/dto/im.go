package dto

type PrivateMessage struct {
	SeqId      uint64 `json:"seq_id"`
	SenderId   uint   `json:"sender_id"`
	ReceiverId uint   `json:"receiver_id"`
	Content    string `json:"content"`
	Type       int    `json:"type"`
	Status     int    `json:"status"`
}

type MessageDTo struct {
	Cmd  int         `json:"cmd"`
	Data interface{} `json:"data"`
}
