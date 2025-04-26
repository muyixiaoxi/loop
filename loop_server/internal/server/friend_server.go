package server

import "github.com/gin-gonic/gin"

type FriendServer interface {
	DisposeFriendRequest(c *gin.Context)
	GetFriendRequestList(c *gin.Context)
	GetFriendList(c *gin.Context)
	AddFriend(c *gin.Context)
	DeleteFriend(c *gin.Context)
	FriendListStatistics(c *gin.Context)
}
