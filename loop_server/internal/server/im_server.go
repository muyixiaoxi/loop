package server

import "github.com/gin-gonic/gin"

type ImServer interface {
	WsHandler(c *gin.Context)
	GetOfflineMessage(c *gin.Context)
	SubmitOfflineMessage(c *gin.Context)
	GetLocalTime(c *gin.Context)
}
