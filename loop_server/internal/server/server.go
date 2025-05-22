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
	llm    LLMServer
}

func NewServer(user UserServer, friend FriendServer, group GroupServer, im ImServer, llm LLMServer) *server {
	return &server{
		user:   user,
		friend: friend,
		group:  group,
		im:     im,
		llm:    llm,
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
		friend.GET("/list/group_id", s.friend.GetFriendListByGroupId)
	}

	group := user.Group("/group")
	{
		group.GET("", s.group.GetGroupList)
		group.GET("/info", s.group.GroupInfo)
		group.POST("/add", s.group.CreateGroup)
		group.POST("/delete", s.group.DeleteGroup)
		group.POST("/exit", s.group.ExitGroup)
		group.POST("/update", s.group.UpdateGroup)
		group.POST("/transfer", s.group.TransferGroupOwner)

		group.GET("/member", s.group.GetGroupMemberList)
		group.GET("/member_less_role", s.group.GetGroupMemberListByLessRole)
		group.POST("/member/add", s.group.AddMember)
		group.POST("/member/delete", s.group.DeleteMember)

		group.POST("/admin/add", s.group.AddAdmin)
		group.POST("/admin/delete", s.group.DeleteAdmin)
	}

	im := r.Group("/im")
	{
		im.Use(middleware.JWTAuthMiddleware())
		im.GET("", s.im.WsHandler)
		im.GET("/offline_message", s.im.GetOfflineMessage)
		im.GET("/local_time", s.im.GetLocalTime)
		im.POST("/submit_message", s.im.SubmitOfflineMessage)
	}
	llm := user.Group("/llm")
	{
		llm.POST("/single_prompt", s.llm.GenerateFromSinglePrompt)
	}
	router.Run(":" + strconv.Itoa(vars.App.Port))
}
