package server

import (
	"github.com/gin-gonic/gin"
	"loop_server/infra/vars"
)

func (*server) wsHandler(c *gin.Context) {
	go vars.Ws.Handler(c)
	vars.Ws.Run(c)
}
