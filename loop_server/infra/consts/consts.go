package consts

import "time"

const (
	TokenExpiration = 24 * time.Hour
)

const (
	FriendRequestStatusUntreated = 0 // 待处理
	FriendRequestStatusAgree     = 1
	FriendRequestStatusRefuse    = 2
)

const (
	WsMessageCmdHeartbeat           = 0 + iota // 心跳
	WsMessageCmdPrivateMessage                 // 私聊
	WsMessageCmdGroupMessage                   // 群聊
	WsMessageCmdAck                            // 应答
	WsMessageCmdPrivateOffer                   // 私聊offer
	WsMessageCmdPrivateAnswer                  // 私聊answer
	WsMessageCmdPrivateIce                     // 私聊ice
	WsMessageCmdGroupInitiatorOffer            // 群聊发起者offer
	WsMessageCmdGroupAnswer                    // 群聊answer
	WsMessageCmdGroupIce                       // 群聊ice
	WsMessageCmdCallInvitation                 // 呼叫邀请
	WsMessageCmdGroupAck                       //群聊应答
	WsMessageCmdRemind              = 100      //提醒
)

const (
	GroupRoleMember = 1 // 普通成员
	GroupRoleAdmin  = 2 // 管理员
	GroupRoleOwner  = 3 // 群主
)

const (
	AckGroupMessage = true
)

const (
	WsParticipantInitiatorYes = true
	WsParticipantInitiatorNo  = false
)

const (
	WsMessageGroupCallMessageTemplate = "邀请你多人聊天"
)

const (
	WsMessageAckStatePending      = "pending"
	WsMessageAckStateAcknowledged = "acknowledged"
)

const (
	GroupMessageTypeText    = 0
	GroupMessageTypePicture = 1
	GroupMessageTypeFile    = 2
	GroupMessageTypeVoice   = 3
	GroupMessageTypeAudio   = 4
	GroupMessageTypeInvite  = 5 // 邀请入群
)
