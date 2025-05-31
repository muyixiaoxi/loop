package application

import (
	"context"
	"github.com/pion/webrtc/v4"
	"loop_server/internal/model/dto"
)

type SfuAPP interface {
	SetOfferGetAnswer(ctx context.Context, groupId uint, senderNickname, senderAvatar string, receiverList []*dto.Receiver, mediaType uint, offer *webrtc.SessionDescription) (*webrtc.SessionDescription, error)
	SetIceCandidateInit(ctx context.Context, groupId uint, senderNickname, senderAvatar string, receiverList []*dto.Receiver, mediaType uint, init *webrtc.ICECandidateInit) error
}
