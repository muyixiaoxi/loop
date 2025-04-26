package server

import (
	"github.com/gin-gonic/gin"
	"loop_server/infra/middleware"
	"loop_server/infra/vars"
	"strconv"
)

type server struct {
	user   UserServer
	friend FriendServer
	group  GroupServer
	im     ImServer
}

func NewServer(user UserServer, friend FriendServer, group GroupServer, im ImServer) *server {
	return &server{
		user:   user,
		friend: friend,
		group:  group,
		im:     im,
	}
}

func (s *server) InitRouter() {
	router := gin.Default()
	router.Use(middleware.Cors())

	r := router.Group("/api/v1")
	{
		r.POST("/register", s.user.Register)
		r.POST("/login", s.user.Login)
	}

	user := r.Group("/user")
	{
		user.Use(middleware.JWTAuthMiddleware())
		user.GET("/query", s.user.QueryUser)
		user.POST("/update_info", s.user.UpdateUserInfo)
		user.POST("/update_password", s.user.UpdateUserPassword)
	}

	friend := user.Group("/friend")
	{
		friend.POST("/add", s.friend.AddFriend)
		friend.POST("/delete", s.friend.DeleteFriend)
		friend.POST("/dispose", s.friend.DisposeFriendRequest)
		friend.GET("/list", s.friend.GetFriendList)
		friend.GET("/request/list", s.friend.GetFriendRequestList)
		friend.GET("/request/statistics", s.friend.FriendListStatistics)
	}

	group := user.Group("/group")
	{
		group.POST("/add", s.group.CreateGroup)
		group.POST("/delete", s.group.DeleteGroup)
		group.GET("", s.group.GetGroupList)

		group.POST("/member/add", s.group.AddMember)
		group.POST("/member/delete", s.group.DeleteMember)
		group.POST("/admin/add", s.group.AddAdmin)
	}

	im := r
	{
		im.Use(middleware.JWTAuthMiddleware())
		r.GET("/im", s.im.WsHandler)
	}
	router.Run(":" + strconv.Itoa(vars.App.Port))
}
