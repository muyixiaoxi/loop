package impl

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log/slog"
	"loop_server/infra/ws"
	"loop_server/internal/application"
	"loop_server/pkg/request"
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
