package sfu

import (
	"errors"
	"fmt"
	"log/slog"
	"sync"

	"github.com/pion/interceptor"
	"github.com/pion/webrtc/v4"
)

// SFU 结构体表示一个 SFU 服务器
type SFU struct {
	rooms                          map[uint]*Room
	roomsLock                      sync.RWMutex
	webrtcAPI                      *webrtc.API
	mediaEngine                    *webrtc.MediaEngine
	participantPeerConnections     map[uint]*Participant
	participantPeerConnectionsLock sync.RWMutex
}

// NewSFU 创建一个新的 SFU 实例
func NewSFU() (*SFU, error) {
	// 创建媒体引擎
	mediaEngine := &webrtc.MediaEngine{}
	if err := mediaEngine.RegisterDefaultCodecs(); err != nil {
		return nil, err
	}

	// 配置 Interceptor
	interceptorRegistry := &interceptor.Registry{}
	if err := webrtc.RegisterDefaultInterceptors(mediaEngine, interceptorRegistry); err != nil {
		return nil, err
	}

	// 创建 API 对象
	api := webrtc.NewAPI(
		webrtc.WithMediaEngine(mediaEngine),
		webrtc.WithInterceptorRegistry(interceptorRegistry),
	)

	return &SFU{
		rooms:                          make(map[uint]*Room),
		webrtcAPI:                      api,
		mediaEngine:                    mediaEngine,
		participantPeerConnections:     make(map[uint]*Participant),
		participantPeerConnectionsLock: sync.RWMutex{},
	}, nil
}

// AddRoom 创建一个新的房间
func (sfu *SFU) AddRoom(roomID uint) (*Room, error) {
	sfu.roomsLock.Lock()
	defer sfu.roomsLock.Unlock()

	if _, ok := sfu.rooms[roomID]; ok {
		return nil, errors.New("room already exists")
	}

	room := &Room{
		id:           roomID,
		participants: make(map[uint]*Participant),
		sfu:          sfu,
	}

	sfu.rooms[roomID] = room
	return room, nil
}

func (sfu *SFU) DeleteRoom(roomID uint) {
	sfu.roomsLock.Lock()
	defer sfu.roomsLock.Unlock()
	delete(sfu.rooms, roomID)
}

// GetRoom 获取房间
func (sfu *SFU) GetRoom(roomID uint) *Room {
	sfu.roomsLock.RLock()
	defer sfu.roomsLock.RUnlock()

	return sfu.rooms[roomID]
}

// CreateOrGetParticipant 创建或者获取 participant
func (sfu *SFU) CreateOrGetParticipant(groupId uint, isInitiator bool, userId uint, initiator func()) (*Participant, error) {
	if participant := sfu.GetParticipant(userId); participant != nil {
		return participant, nil
	}
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}
	pc, err := sfu.webrtcAPI.NewPeerConnection(config)
	if err != nil {
		slog.Error("SFU.CreatePeerConnection NewPeerConnection error: ", err)
		return nil, err
	}
	pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		fmt.Println("webrtc ice状态监听:", state)
		switch state {
		case webrtc.ICEConnectionStateFailed, webrtc.ICEConnectionStateClosed:
			fmt.Println("webrtc 失败或关闭")
			sfu.GetRoom(groupId).RemoveParticipant(userId)
		case webrtc.ICEConnectionStateConnected: // 创建者连接成功后，通知其他用户
			fmt.Println("webrtc 已连接")
			if sfu.GetParticipant(userId).isInitiator {
				sfu.GetParticipant(userId).initiatorFunc()
			}
		}
	})

	return &Participant{
		id:            userId,
		PeerConn:      pc,
		lock:          sync.Mutex{},
		IceChan:       make(chan *webrtc.ICECandidate, 10),
		isInitiator:   isInitiator,
		initiatorFunc: initiator,
	}, nil
}

func (sfu *SFU) GetParticipant(userId uint) *Participant {
	sfu.participantPeerConnectionsLock.RLock()
	defer sfu.participantPeerConnectionsLock.RUnlock()
	return sfu.participantPeerConnections[userId]
}

func (sfu *SFU) SetParticipant(userId uint, pc *Participant) {
	sfu.participantPeerConnectionsLock.Lock()
	defer sfu.participantPeerConnectionsLock.Unlock()
	sfu.participantPeerConnections[userId] = pc
}

func (sfu *SFU) DeleteParticipant(userId uint) {
	sfu.participantPeerConnectionsLock.Lock()
	defer sfu.participantPeerConnectionsLock.Unlock()
	delete(sfu.participantPeerConnections, userId)
}
