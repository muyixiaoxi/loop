package impl

import (
	"github.com/gin-gonic/gin"
	"loop_server/internal/application"
	"loop_server/internal/model/param"
	"loop_server/pkg/response"
)

type friendServerImpl struct {
	friend application.FriendApp
}

func NewFriendServerImpl(friend application.FriendApp) *friendServerImpl {
	return &friendServerImpl{
		friend: friend,
	}
}

func (f *friendServerImpl) DisposeFriendRequest(c *gin.Context) {
	var p param.DisposeFriendRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	err := f.friend.DisposeFriendRequest(c, p.RequesterId, p.Status)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, nil)
}

func (f *friendServerImpl) GetFriendRequestList(c *gin.Context) {
	list, err := f.friend.GetFriendRequest(c)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, list)
}

func (f *friendServerImpl) GetFriendList(c *gin.Context) {
	list, err := f.friend.GetFriendList(c)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, list)
}

// AddFriend 添加好友
func (f *friendServerImpl) AddFriend(c *gin.Context) {
	var p param.AddFriendRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}

	if err := f.friend.AddFriend(c, p.FriendId, p.Message); err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, nil)
}

func (f *friendServerImpl) DeleteFriend(c *gin.Context) {
	var p param.DeleteFriendRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	err := f.friend.DeleteFriend(c, p.FriendId)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, nil)
}

func (f *friendServerImpl) FriendListStatistics(c *gin.Context) {
	data, err := f.friend.FriendListStatistics(c)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, data)
}

func (f *friendServerImpl) GetFriendListByGroupId(c *gin.Context) {
	input := &param.GroupId{}
	if err := c.ShouldBind(input); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	data, err := f.friend.GetFriendListByGroupId(c, input.GroupId)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, data)
}
