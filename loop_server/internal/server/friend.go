package server

import (
	"github.com/gin-gonic/gin"
	"loop_server/internal/model/param"
	"loop_server/pkg/response"
)

func (s *server) disposeFriendRequest(c *gin.Context) {
	var p param.DisposeFriendRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	err := s.friend.DisposeFriendRequest(c, p.RequesterId, p.Status)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, nil)
}

func (s *server) getFriendRequestList(c *gin.Context) {
	list, err := s.friend.GetFriendRequest(c)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, list)
}

func (s *server) getFriendList(c *gin.Context) {
	var page param.Page
	if err := c.ShouldBind(&page); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	page.Init()
	list, err := s.friend.GetFriendList(c, &page)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, list)
}

// addFriend 添加好友
func (s *server) addFriend(c *gin.Context) {
	var p param.AddFriendRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}

	if err := s.friend.AddFriend(c, p.FriendId, p.Message); err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, nil)
}
