package ws

import (
	"errors"
	"github.com/gorilla/websocket"
	"net/http"
	"sync"
	"time"
)

var Upgrade = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	Conn       *websocket.Conn
	Mu         sync.Mutex // websocket 并发写会panic
	UserId     uint
	LastActive int64 // 时间戳 s
}

type clientShard struct {
	clients map[uint]*Client
	mu      sync.RWMutex
}

type Server struct {
	clientShards []*clientShard
	shardCount   uint
	clearTicker  time.Duration
	maxGap       time.Duration
}

func NewWsServer(shardCount uint, clearTicker, maxGap time.Duration) *Server {
	shards := make([]*clientShard, shardCount)
	for i := 0; i < len(shards); i++ {
		shards[i] = &clientShard{
			clients: make(map[uint]*Client),
		}
	}

	s := &Server{
		clientShards: shards,
		shardCount:   shardCount,
		clearTicker:  clearTicker,
		maxGap:       maxGap,
	}
	go s.clear()
	return s
}

func (s *Server) getShard(userId uint) *clientShard {
	return s.clientShards[userId%s.shardCount]
}

func (s *Server) Set(key uint, value *Client) {
	shard := s.getShard(key)
	shard.mu.Lock()
	defer shard.mu.Unlock()
	shard.clients[key] = value
}

func (s *Server) Get(key uint) *Client {
	shard := s.getShard(key)
	shard.mu.RLock()
	defer shard.mu.RUnlock()
	return shard.clients[key]
}

func (s *Server) Delete(key uint) {
	shard := s.getShard(key)
	shard.mu.Lock()
	defer shard.mu.Unlock()
	if client := shard.clients[key]; client != nil && client.Conn != nil {
		client.Conn.Close()
	}
	delete(shard.clients, key)
}

func (s *Server) UpdateLastActive(userId uint) {
	shard := s.getShard(userId)
	if client := shard.clients[userId]; client != nil {
		client.LastActive = time.Now().Unix()
	}
}

func (s *Server) SendMessage(userId uint, msg []byte) error {
	client := s.Get(userId)
	if client == nil {
		return errors.New("client not exist")
	}

	var err error
	func() {
		client.Mu.Lock()
		defer client.Mu.Unlock()
		err = client.Conn.WriteMessage(websocket.TextMessage, msg)
	}()

	for i := 0; i < 2 && err != nil; i++ {
		time.Sleep(time.Second)
		client = s.Get(userId)
		if client == nil {
			return errors.New("client connection is closed")
		}
		func() {
			client.Mu.Lock()
			defer client.Mu.Unlock()
			err = client.Conn.WriteMessage(websocket.TextMessage, msg)
		}()
	}

	return err
}

func (s *Server) clear() {
	ticker := time.NewTicker(s.clearTicker)
	for {
		select {
		case <-ticker.C:
			gap := time.Now().Add(-s.maxGap).Unix()
			for _, shard := range s.clientShards {
				var toDelete []uint
				shard.mu.RLock()
				for _, client := range shard.clients {
					if client.LastActive < gap {
						toDelete = append(toDelete, client.UserId)
					}
				}
				shard.mu.RUnlock()

				if len(toDelete) > 0 {
					shard.mu.Lock()
					for _, userId := range toDelete {
						if client := shard.clients[userId]; client != nil {
							client.Conn.Close()
							delete(shard.clients, userId)
						}
					}
					shard.mu.Unlock()
				}
			}
		}
	}
}
