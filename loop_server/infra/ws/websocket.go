package ws

import (
	"context"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log/slog"
	"loop_server/pkg/request"
	"net/http"
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
	UserId uint
}

type Server struct {
	Clients    map[uint]*Client
	Broadcast  chan []byte  // 广播消息的通道
	Register   chan *Client // 注册客户端的通道
	Unregister chan *Client // 注销客户端的通道
}

type Message struct {
	Cmd  int         `json:"cmd"`  // 消息类型：0-心跳，1-私聊，2-群聊
	Data interface{} `json:"data"` // 消息
}

func NewWsServer() *Server {
	return &Server{
		Clients:    make(map[uint]*Client),
		Broadcast:  make(chan []byte),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (ws *Server) Handler(c *gin.Context) {
	userId := request.GetCurrentUser(c)

	conn, err := Upgrade.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		slog.Error("upgrade error", err)
		return
	}
	client := &Client{Conn: conn, UserId: userId}
	ws.Register <- client
	defer func() {
		ws.Unregister <- client
		conn.Close()
	}()

	for {
		_, msgByte, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
				slog.Error("websocket connection closed abnormally err:", err)
			}
			break
		}

		ws.Broadcast <- msgByte
	}
}

func (ws *Server) Run(c *gin.Context, do func(ctx context.Context, msgByte []byte) error) {
	for {
		select {
		case client := <-ws.Register:
			ws.Clients[client.UserId] = client
			slog.Debug("user %d connected", client.UserId)

		case client := <-ws.Unregister:
			delete(ws.Clients, client.UserId)
			slog.Debug("user %d disconnected", client.UserId)

		case message := <-ws.Broadcast:
			do(c, message)
		}
	}
}
