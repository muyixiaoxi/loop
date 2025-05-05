package application

import (
	"context"
	"github.com/pion/webrtc/v4"
)

type SfuAPP interface {
	SetOfferGetAnswer(ctx context.Context, groupId uint, senderNickname, senderAvatar string, receiverIdList []uint, receiverAvatarList []string, mediaType uint, offer *webrtc.SessionDescription) (*webrtc.SessionDescription, error)
	SetIceCandidateInit(ctx context.Context, groupId uint, senderNickname, senderAvatar string, receiverIdList []uint, receiverAvatarList []string, mediaType uint, init *webrtc.ICECandidateInit) error
}
