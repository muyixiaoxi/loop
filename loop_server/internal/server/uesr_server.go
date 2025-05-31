package server

import "github.com/gin-gonic/gin"

type UserServer interface {
	Login(c *gin.Context)
	Register(c *gin.Context)
	QueryUser(c *gin.Context)
	UpdateUserInfo(c *gin.Context)
	UpdateUserPassword(c *gin.Context)
	RefreshToken(c *gin.Context)
}
