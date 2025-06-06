package server

import "github.com/gin-gonic/gin"

type GroupServer interface {
	CreateGroup(c *gin.Context)
	UpdateGroup(c *gin.Context)
	DeleteGroup(c *gin.Context)
	GetGroupList(c *gin.Context)
	AddMember(c *gin.Context)
	DeleteMember(c *gin.Context)
	AddAdmin(c *gin.Context)
	DeleteAdmin(c *gin.Context)
	GroupInfo(c *gin.Context)
	GetGroupMemberList(c *gin.Context)
	GetGroupMemberListByLessRole(c *gin.Context)
	ExitGroup(c *gin.Context)
	TransferGroupOwner(c *gin.Context)
}
