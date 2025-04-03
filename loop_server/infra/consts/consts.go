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
	WsMessageCmdHeartbeat      = 0
	WsMessageCmdPrivateMessage = 1
	WsMessageCmdGroupMessage   = 2
)
