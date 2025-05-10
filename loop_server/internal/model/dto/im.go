package dto

import (
	"encoding/json"
	"github.com/pion/webrtc/v4"
)

type PrivateMessage struct {
	SeqId          string `json:"seq_id"`          // 唯一标识
	SenderId       uint   `json:"sender_id"`       // 发送者id
	ReceiverId     uint   `json:"receiver_id"`     // 接收者id
	Content        string `json:"content"`         // 消息内容
	Type           int    `json:"type"`            // 消息类型:0-文字，1-图片，2-文件，3-语音，4-视频
	SendTime       int64  `json:"send_time"`       // 发送时间戳
	SenderNickname string `json:"sender_nickname"` // 发送者昵称
	SenderAvatar   string `json:"sender_avatar"`   // 发送者头像
}

type GroupMessage struct {
	SeqId          string `json:"seq_id"`          // 唯一标识
	SenderId       uint   `json:"sender_id"`       // 发送者id
	ReceiverId     uint   `json:"receiver_id"`     // 接收者id
	Content        string `json:"content"`         // 消息内容
	Type           int    `json:"type"`            // 消息类型:0-文字，1-图片，2-文件，3-语音，4-视频
	SendTime       int64  `json:"send_time"`       // 发送时间戳
	SenderNickname string `json:"sender_nickname"` // 发送者昵称
	SenderAvatar   string `json:"sender_avatar"`   // 发送者头像
	GroupName      string `json:"group_name"`      // 群名称
	GroupAvatar    string `json:"group_avatar"`    // 群头像
}

type GroupOfflineMessage struct {
	SeqId string `json:"seq_id"` // 唯一标识
}

type Ack struct {
	SeqId      string `json:"seq_id"`      // 唯一标识
	SenderId   uint   `json:"sender_id"`   // 发送者Id
	ReceiverId uint   `json:"receiver_id"` // 接收者Id
	IsGroup    bool   `json:"is_group"`    // 是否是群消息
}

type WebRTCMessage struct {
	SenderId           uint                       `json:"sender_id"`                      // 发送者Id
	SenderNickname     string                     `json:"sender_nickname,omitempty"`      // 发送者昵称
	SenderAvatar       string                     `json:"sender_avatar,omitempty"`        // 发送者头像
	ReceiverId         uint                       `json:"receiver_id,omitempty"`          // 接收者Id
	ReceiverIdList     []uint                     `json:"receiver_id_list,omitempty"`     // 接收者Id列表
	ReceiverAvatarList []string                   `json:"receiver_avatar_list,omitempty"` // 接收者头像列表
	Content            string                     `json:"content"`                        // 消息内容
	IsInitiator        bool                       `json:"is_initiator,omitempty"`         // 是否为发起者
	MediaType          uint                       `json:"media_type"`                     // 媒体类型:0-音频，1-视频
	GroupId            uint                       `json:"group_id,omitempty"`             // 群组Id
	SessionDescription *webrtc.SessionDescription `json:"session_description,omitempty"`  // sdp信息
	CandidateInit      *webrtc.ICECandidateInit   `json:"candidate_init,omitempty"`       // ice信息
	Candidate          *webrtc.ICECandidate       `json:"candidate,omitempty"`            // ice信息
}

type Message struct {
	Cmd   int             `json:"cmd"`
	Token string          `json:"token,omitempty"`
	Data  json.RawMessage `json:"data"`
}
