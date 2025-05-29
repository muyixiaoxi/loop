package impl

import (
	"context"
	"github.com/pion/webrtc/v4"
	"loop_server/infra/consts"
	"loop_server/infra/vars"
	"loop_server/internal/domain"
	"loop_server/internal/model/dto"
	"loop_server/pkg/request"
)

type sfuAppImpl struct {
	imDomain domain.ImDomain
}

func NewSfuAppImpl(imDomain domain.ImDomain) *sfuAppImpl {
	return &sfuAppImpl{imDomain: imDomain}
}

func (s *sfuAppImpl) SetOfferGetAnswer(ctx context.Context, groupId uint, senderNickname, senderAvatar string, receiverList []*dto.Receiver, mediaType uint, offer *webrtc.SessionDescription) (*webrtc.SessionDescription, error) {
	userId := request.GetCurrentUser(ctx)
	isInitiator := len(receiverList) > 0
	var initiator func()
	if isInitiator {
		initiator = func() {
			// 发送通知
			for _, receiver := range receiverList {
				s.imDomain.SendMessage(ctx, consts.WsMessageCmdCallInvitation, receiver.Id, &dto.WebRTCMessage{
					SenderId:       request.GetCurrentUser(ctx),
					SenderNickname: senderNickname,
					SenderAvatar:   senderAvatar,
					ReceiverId:     groupId,
					ReceiverList:   receiverList,
					Content:        senderNickname + consts.WsMessageGroupCallMessageTemplate,
					MediaType:      mediaType,
				})
			}
		}
	}
	// 如何是发起者，webrtc连接成功后，通知其他人
	participant, err := vars.Sfu.CreateOrGetParticipant(groupId, isInitiator, userId, initiator)
	if err != nil {
		return nil, err
	}
	participant.PeerConn.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			return
		}
		s.imDomain.SendMessage(ctx, consts.WsMessageCmdGroupIce, userId, &dto.WebRTCMessage{
			SenderId:   groupId,
			ReceiverId: userId,
			Candidate:  candidate,
		})
	})

	answer, err := participant.SetOfferAndGetAnswer(offer)
	if err != nil {
		return nil, err
	}

	room, err := vars.Sfu.AddRoom(groupId)
	if err != nil {
		return nil, err
	}

	_, err = room.AddParticipant(userId, participant)
	if err != nil {
		return nil, err
	}
	return answer, nil
}

func (s *sfuAppImpl) SetIceCandidateInit(ctx context.Context, groupId uint, senderNickname, senderAvatar string, receiverList []*dto.Receiver, mediaType uint, init *webrtc.ICECandidateInit) error {
	isInitiator := len(receiverList) > 0
	var initiator func()
	if isInitiator {
		initiator = func() {
			// 发送通知
			for _, receiver := range receiverList {
				s.imDomain.SendMessage(ctx, consts.WsMessageCmdCallInvitation, receiver.Id, &dto.WebRTCMessage{
					SenderId:       request.GetCurrentUser(ctx),
					SenderNickname: senderNickname,
					SenderAvatar:   senderAvatar,
					ReceiverId:     groupId,
					ReceiverList:   receiverList,
					Content:        senderNickname + consts.WsMessageGroupCallMessageTemplate,
					MediaType:      mediaType,
				})
			}
		}
	}
	participant, err := vars.Sfu.CreateOrGetParticipant(groupId, len(receiverList) > 0, request.GetCurrentUser(ctx), initiator)
	if err != nil || participant == nil {
		return err
	}
	return participant.PeerConn.AddICECandidate(*init)
}
