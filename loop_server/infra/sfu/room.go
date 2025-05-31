package sfu

import (
	"errors"
	"fmt"
	"github.com/pion/webrtc/v4"
	"log/slog"
	"sync"
)

// Room 表示一个房间，包含多个参与者
type Room struct {
	id           uint
	participants map[uint]*Participant
	lock         sync.RWMutex
	sfu          *SFU
}

// AddParticipant 添加参与者到房间
func (r *Room) AddParticipant(participantID uint, participant *Participant) (*Participant, error) {
	r.lock.Lock()
	defer r.lock.Unlock()

	if _, ok := r.participants[participantID]; ok {
		return nil, errors.New("participant already exists")
	}

	r.participants[participantID] = participant

	r.sfu.SetParticipant(participantID, participant)

	// 设置远程轨道处理
	participant.PeerConn.OnTrack(func(remoteTrack *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		var err error
		defer func() {
			if err != nil {
				fmt.Println("异常删除了")
				r.RemoveParticipant(participantID)
			}
		}()
		fmt.Println("onTrack 被调用啦", remoteTrack, receiver)
		// 为每个新轨道创建一个本地轨道来转发给其他参与者
		var localTrack *webrtc.TrackLocalStaticRTP
		localTrack, err = webrtc.NewTrackLocalStaticRTP(remoteTrack.Codec().RTPCodecCapability, remoteTrack.ID(), remoteTrack.StreamID())
		if err != nil {
			fmt.Printf("Failed to create local track: %v\n", err)
			return
		}

		if _, err := participant.PeerConn.AddTrack(localTrack); err != nil {
			fmt.Println("添加轨道失败")
			return
		}
		fmt.Println("添加轨道成功")

		//// 转发这个轨道给房间里的其他参与者
		//r.broadcastTrack(participantID, track, localTrack)
		//
		//// 读取远程轨道的RTP包并写入本地轨道

		go func() {
			buf := make([]byte, 1500)
			for {
				var n int
				n, _, err = remoteTrack.Read(buf)
				if err != nil {
					fmt.Printf("Track read error: %v\n", err)
					return
				}

				_, err = localTrack.Write(buf[:n])
				if err != nil {
					fmt.Printf("Track write error: %v\n", err)
					return
				}
			}
		}()
	})

	participant.PeerConn.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		fmt.Printf("ICE Connection State for %s has changed: %s\n", participantID, state.String())
		switch state {
		case webrtc.ICEConnectionStateConnected:
			if participant.isInitiator {
				participant.initiatorFunc()
			}

		case webrtc.ICEConnectionStateDisconnected, webrtc.ICEConnectionStateFailed:
			fmt.Println("连接失败,删除了")
			r.RemoveParticipant(participantID)
		}
	})

	return participant, nil
}

// broadcastTrack 将轨道广播给房间中的其他参与者
func (r *Room) broadcastTrack(senderID uint, remoteTrack *webrtc.TrackRemote, localTrack *webrtc.TrackLocalStaticRTP) {
	r.lock.RLock()
	defer r.lock.RUnlock()

	for participantID, participant := range r.participants {
		// todo: 暂时不屏蔽发送者自己
		//if participantID == senderID {
		//	continue // 不发送给发送者自己
		//}

		// 为每个参与者添加轨道
		if _, err := participant.PeerConn.AddTrack(localTrack); err != nil {
			fmt.Printf("Failed to add track to participant %s: %v\n", participantID, err)
			continue
		}

		// 如果需要，重新协商
		if len(participant.PeerConn.GetTransceivers()) == 0 {
			offer, err := participant.PeerConn.CreateOffer(nil)
			if err != nil {
				fmt.Printf("Failed to create offer for participant %s: %v\n", participantID, err)
				continue
			}

			if err = participant.PeerConn.SetLocalDescription(offer); err != nil {
				fmt.Printf("Failed to set local description for participant %s: %v\n", participantID, err)
				continue
			}

			// 这里需要通过信令服务器发送 offer 给客户端
			// 你需要实现这部分逻辑，通过你的 WebSocket 信令
			fmt.Printf("Need to send offer to participant %s\n", participantID)
		}
	}
}

// RemoveParticipant 从房间中移除参与者
// 1. 关闭 PeerConnection
// 2. 从房间参与者列表中删除
// 3. 如果房间中没有其他参与者，则删除整个房间
// 4. 删除participantPeerConnections
func (r *Room) RemoveParticipant(participantID uint) {
	r.lock.Lock()
	defer r.lock.Unlock()

	if participant, ok := r.participants[participantID]; ok {
		// 关闭 peer connection
		if participant.PeerConn != nil {
			if err := participant.PeerConn.Close(); err != nil {
				slog.Error("Failed to close peer connection: ", err)
			}
		}
		// 房间参与者
		delete(r.participants, participantID)
		fmt.Println("房间参与者释放:", r)
		// 删除participantPeerConnections
		r.sfu.DeleteParticipant(participantID)
		fmt.Println("participantPeerConnections释放:", r.sfu.participantPeerConnections)
		if len(r.participants) == 0 {
			r.sfu.DeleteRoom(r.id)
			fmt.Println("房间释放 rooms:", r.sfu.rooms)
		}
	}
}
