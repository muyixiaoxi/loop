package consts

import "time"

const (
	TokenExpiration = 24 * time.Hour
)

const (
	FriendRequestStatusAgree  = 1
	FriendRequestStatusRefuse = 2
)

const (
	WsMessageCmdHeartbeat      = 0   // 心跳
	WsMessageCmdPrivateMessage = 1   // 私聊
	WsMessageCmdGroupMessage   = 2   // 群聊
	WsMessageCmdAck            = 3   // 在线应答
	WsMessageCmdRemind         = 100 //提醒
)

const (
	GroupRoleMember = 1 // 普通成员
	GroupRoleAdmin  = 2 // 管理员
	GroupRoleOwner  = 3 // 群主
)
