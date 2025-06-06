package impl

import (
	"context"
	"github.com/pion/webrtc/v4"
	"log/slog"
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
				// 如果用户在线转发通知
				if s.imDomain.IsOnline(ctx, receiver.Id) {
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
	}
	// 如何是发起者，webrtc连接成功后，通知其他人
	participant, err := vars.Sfu.CreateOrGetParticipant(groupId, isInitiator, userId, initiator)
	if err != nil {
		return nil, err
	}
	participant.PeerConn.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			close(participant.IceChan)
			return
		}
		// 收集ice
		participant.IceChan <- candidate
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

func (s *sfuAppImpl) SetIceCandidateInit(ctx context.Context, init *webrtc.ICECandidateInit) ([]*webrtc.ICECandidate, error) {
	participant := vars.Sfu.GetParticipant(request.GetCurrentUser(ctx))
	if participant == nil {
		return nil, nil
	}
	err := participant.PeerConn.AddICECandidate(*init)
	if err != nil {
		slog.Error("sfuAppImpl.SetIceCandidateInit AddICECandidate", "err", err)
		return nil, err
	}
	list := []*webrtc.ICECandidate{}
	for i := range participant.IceChan {
		list = append(list, i)
	}
	return list, nil
}
