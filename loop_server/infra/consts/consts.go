package consts

import "time"

const (
	TokenExpiration = 24 * time.Hour
)

const (
	Duplicate = "Duplicate entry"
)

const (
	FriendRequestStatusAgree  = 1
	FriendRequestStatusRefuse = 2
)

const (
	WsMessageCmdHeartbeat      = 0   // 心跳
	WsMessageCmdPrivateMessage = 1   // 私聊
	WsMessageCmdGroupMessage   = 2   // 群聊
	WsMessageCmdOnlineAck      = 3   // 在线应答
	WsMessageCmdRemind         = 100 //提醒
)
