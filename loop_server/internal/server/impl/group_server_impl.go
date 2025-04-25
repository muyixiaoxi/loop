package impl

import (
	"errors"
	"github.com/gin-gonic/gin"
	"log/slog"
	"loop_server/infra/consts"
	"loop_server/internal/application"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/param"
	"loop_server/pkg/response"
	"strings"
)

type groupServerImpl struct {
	group application.GroupApp
}

func NewGroupServerImpl(group application.GroupApp) *groupServerImpl {
	return &groupServerImpl{group: group}
}

func (g *groupServerImpl) CreateGroup(c *gin.Context) {
	param := new(dto.CreateGroupRequest)
	if err := c.ShouldBind(param); err != nil {
		slog.Error("groupServerImpl.CreateGroup c.ShouldBind(&group) err:", err)
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	group, err := g.group.CreateGroup(c, param)
	if err != nil {
		if errors.Is(err, consts.ErrPartUserNotExist) {
			response.Fail(c, response.CodePartUserNotExist)
			return
		}
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, group)
	return
}

func (g *groupServerImpl) GetGroup(c *gin.Context) {
	data, err := g.group.GetGroupList(c)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, data)
	return
}

func (g *groupServerImpl) DeleteMember(c *gin.Context) {
	input := &param.DeleteMember{}
	if err := c.ShouldBind(input); err != nil {
		slog.Error("groupServerImpl.DeleteMember c.ShouldBind(&param) err:", err)
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	err := g.group.DeleteMember(c, input.GroupId, input.UserId)
	if err != nil {
		if errors.Is(err, consts.ErrNoPermission) {
			response.Fail(c, response.CodeNoPermission)
			return
		}
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, nil)
}

func (g *groupServerImpl) AddMember(c *gin.Context) {
	input := &param.AddMember{}
	if err := c.ShouldBind(input); err != nil {
		slog.Error("groupServerImpl.AddMember c.ShouldBind(&param) err:", err)
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	err := g.group.AddMember(c, input.GroupId, input.UserIds)
	if err != nil {
		if strings.Contains(err.Error(), consts.Duplicate) {
			response.Fail(c, response.CodeGroupUserExist)
			return
		}
		if errors.Is(err, consts.ErrPartUserNotExist) {
			response.Fail(c, response.CodePartUserNotExist)
			return
		}
		if errors.Is(err, consts.ErrNoPermission) {
			response.Fail(c, response.CodeNoPermission)
			return
		}
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, nil)
	return
}

func (g *groupServerImpl) AddAdmin(c *gin.Context) {
	input := &param.AddAdmin{}
	if err := c.ShouldBind(input); err != nil {
		slog.Error("groupServerImpl.AddAdmin c.ShouldBind(&param) err:", err)
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	err := g.group.AddAdmin(c, input.GroupId, input.UserId)
	if err != nil {
		if errors.Is(err, consts.ErrNoPermission) {
			response.Fail(c, response.CodeNoPermission)
			return
		}
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, nil)
}
