package server

import (
	"github.com/gin-gonic/gin"
	"loop_server/infra/middleware"
	"loop_server/infra/vars"
	"loop_server/internal/application"
	"strconv"
)

type server struct {
	user   application.UserApp
	friend application.FriendApp
}

func NewServer(user application.UserApp, friend application.FriendApp) *server {
	return &server{
		user:   user,
		friend: friend,
	}
}

func (s *server) Init() {
	router := gin.Default()
	router.Use(middleware.Cors())

	r := router.Group("/api/v1")

	r.POST("/register", s.register)
	r.POST("/login", s.login)

	user := r.Group("/user")
	user.Use(middleware.JWTAuthMiddleware())
	user.GET("/query", s.queryUser)
	user.POST("/friend/add", s.addFriend)
	user.POST("/friend/dispose", s.disposeFriendRequest)
	user.GET("/friend/request/list", s.getFriendRequestList)
	user.GET("/friend/list", s.getFriendList)

	user.GET("/im", s.wsHandler)
	router.Run(":" + strconv.Itoa(vars.App.Port))
}
