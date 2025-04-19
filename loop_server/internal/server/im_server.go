package server

import "github.com/gin-gonic/gin"

type ImServer interface {
	WsHandler(c *gin.Context)
}
