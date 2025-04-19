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
	im     ImServer
}

func NewServer(user UserServer, friend FriendServer, im ImServer) *server {
	return &server{
		user:   user,
		friend: friend,
		im:     im,
	}
}

func (s *server) Init() {
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
		friend.POST("/dispose", s.friend.DisposeFriendRequest)
		friend.GET("/request/list", s.friend.GetFriendRequestList)
		friend.GET("/list", s.friend.GetFriendList)
	}
	im := r
	{
		im.Use(middleware.JWTAuthMiddleware())
		r.GET("/im", s.im.WsHandler)
	}
	router.Run(":" + strconv.Itoa(vars.App.Port))
}
