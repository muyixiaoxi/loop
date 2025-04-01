package server

import (
	"github.com/gin-gonic/gin"
	"loop_server/infra/middleware"
	"loop_server/infra/vars"
	"loop_server/internal/application"
	"strconv"
)

type server struct {
	user application.UserApp
}

func NewServer(user application.UserApp) *server {
	return &server{user: user}
}

func (s *server) Init() {

	router := gin.Default()
	r := router.Group("/api/v1")

	r.POST("/register", s.register)
	r.POST("/login", s.login)
	r.Use(middleware.JWTAuthMiddleware())
	r.GET("/1", func(context *gin.Context) {

	})

	router.Run(":" + strconv.Itoa(vars.App.Port))
}
