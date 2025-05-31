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
	Conn   *websocket.Conn
	Mu     *sync.Mutex
	UserId uint
}

type Server struct {
	clients map[uint]*Client
	mu      sync.RWMutex // 读写保护
}

func NewWsServer() *Server {
	return &Server{
		clients: make(map[uint]*Client),
		mu:      sync.RWMutex{},
	}
}

func (s *Server) Set(key uint, value *Client) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.clients[key] = value
}

func (s *Server) Get(key uint) *Client {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.clients[key]
}

func (s *Server) Delete(key uint) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.clients, key)
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
