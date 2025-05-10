package impl

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log/slog"
	"loop_server/infra/ws"
	"loop_server/internal/application"
	"loop_server/internal/model/dto"
	"loop_server/pkg/request"
	"loop_server/pkg/response"
	"sync"
	"time"
)

type imServerImpl struct {
	im application.ImApp
}

func NewImServerImpl(im application.ImApp) *imServerImpl {
	return &imServerImpl{
		im: im,
	}
}

func (i *imServerImpl) WsHandler(c *gin.Context) {

	conn, err := ws.Upgrade.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		slog.Error("upgrade error", err)
		return
	}
	defer conn.Close()

	if err != nil {
		slog.Error("parse token err:", err)
		return
	}
	userId := request.GetCurrentUser(c)
	client := &ws.Client{
		UserId: userId,
		Conn:   conn,
		Mu:     &sync.Mutex{},
	}

	i.im.AddOnlineUser(c, client)
	defer i.im.RemoveOnlineUser(c, userId)

	i.messageListener(c, client)

}

func (i *imServerImpl) messageListener(c *gin.Context, client *ws.Client) {
	for {
		_, msgByte, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway) {
				slog.Error("websocket connection closed abnormally err:", err)
			}
			break
		}
		i.im.HandleMessage(c, client.UserId, msgByte)
	}
}

func (i *imServerImpl) GetOfflineMessage(c *gin.Context) {
	messages, err := i.im.GetOfflineMessage(c, request.GetCurrentUser(c))
	if err != nil {
		slog.Error("get offline message err:", err)
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, messages)
}

func (i *imServerImpl) SubmitOfflineMessage(c *gin.Context) {
	var input []*dto.Ack
	if err := c.ShouldBindJSON(&input); err != nil {
		slog.Error("bind json error:", err)
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	if err := i.im.SubmitOfflineMessage(c, request.GetCurrentUser(c), input); err != nil {
		slog.Error("submit offline message error:", err)
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, nil)
}

func (i *imServerImpl) GetLocalTime(c *gin.Context) {
	var res struct {
		Time int64 `json:"time"`
	}
	res.Time = time.Now().UnixMilli()
	response.Success(c, res)
}
