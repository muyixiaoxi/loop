package server

import "github.com/gin-gonic/gin"

type GroupServer interface {
	CreateGroup(c *gin.Context)
	DeleteGroup(c *gin.Context)
	GetGroup(c *gin.Context)
	AddMember(c *gin.Context)
	DeleteMember(c *gin.Context)
	AddAdmin(c *gin.Context)
}
