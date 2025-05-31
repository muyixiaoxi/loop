package sfu

import (
	"github.com/pion/webrtc/v4"
	"log/slog"
	"sync"
)

// Participant 表示一个房间中的参与者
type Participant struct {
	id            uint
	PeerConn      *webrtc.PeerConnection
	isInitiator   bool // 是否是发起者
	initiatorFunc func()
	lock          sync.Mutex
}

// SetOfferAndGetAnswer 设置 Offer 并返回 Answer
func (p *Participant) SetOfferAndGetAnswer(offer *webrtc.SessionDescription) (*webrtc.SessionDescription, error) {
	if err := p.PeerConn.SetRemoteDescription(*offer); err != nil {
		slog.Error("SFU.SetOfferAndGetAnswer SetRemoteDescription error: ", err)
		return nil, err
	}

	answer, err := p.PeerConn.CreateAnswer(nil)
	if err != nil {
		slog.Error("SFU.SetOfferAndGetAnswer CreateAnswer error: ", err)
		return nil, err
	}

	if err = p.PeerConn.SetLocalDescription(answer); err != nil {
		slog.Error("SFU.SetOfferAndGetAnswer SetLocalDescription error: ", err)
		return nil, err
	}

	return &answer, nil
}

func (p *Participant) SetICECandidate(candidate *webrtc.ICECandidateInit) error {
	if p.PeerConn == nil {
		slog.Error("SFU.SetICECandidate pc is nil")
		return nil
	}
	if candidate == nil {
		slog.Error("SFU.SetICECandidate candidate is nil")
		return nil
	}

	err := p.PeerConn.AddICECandidate(*candidate)
	if err != nil {
		slog.Error("SFU.SetICECandidate AddICECandidate error: ", err)
	}
	return err
}
