package server

import (
	"github.com/gin-gonic/gin"
	_ "github.com/gin-gonic/gin"
	"loop_server/infra/consts"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/param"
	"loop_server/pkg/response"
	"strings"
)

// login 登录
func (s *server) login(c *gin.Context) {
	var p param.LoginRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}

	user, err := s.user.Login(c, p.Phone, p.Password)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	if user == nil {
		response.Fail(c, response.CodePhoneOrPasswordError)
		return
	}
	response.Success(c, user)
}

// register 注册
func (s *server) register(c *gin.Context) {
	var p param.RegisterRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	user := &dto.User{
		Nickname: p.Nickname,
		Password: p.Password,
		Phone:    p.Phone,
	}

	if err := s.user.Register(c, user); err != nil {
		if strings.Contains(err.Error(), consts.Duplicate) {
			response.Fail(c, response.CodePhoneExist)
		} else {
			response.Fail(c, response.CodeServerBusy)
		}
		return
	}
	response.Success(c, nil)
}

func (s *server) queryUser(c *gin.Context) {
	var p param.QueryUserRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	user, err := s.user.QueryUser(c, &dto.QueryUserRequest{
		Phone:  p.Phone,
		UserId: p.UserId,
	})
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, user)
}
