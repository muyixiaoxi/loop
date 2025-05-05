package impl

import (
	"github.com/gin-gonic/gin"
	_ "github.com/gin-gonic/gin"
	"loop_server/infra/consts"
	"loop_server/internal/application"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/param"
	"loop_server/pkg/request"
	"loop_server/pkg/response"
	"strings"
)

type userServerImpl struct {
	user application.UserApp
}

func NewUserServerImpl(user application.UserApp) *userServerImpl {
	return &userServerImpl{
		user: user,
	}
}

// Login 登录
func (u *userServerImpl) Login(c *gin.Context) {
	var p param.LoginRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}

	user, err := u.user.Login(c, p.Phone, p.Password)
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

// Register 注册
func (u *userServerImpl) Register(c *gin.Context) {
	var p param.RegisterRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	user := &dto.User{
		Nickname: p.Nickname,
		Password: p.Password,
		Phone:    p.Phone,
		Avatar:   consts.GetDefaultAvatar(),
	}

	if err := u.user.Register(c, user); err != nil {
		if strings.Contains(err.Error(), consts.Duplicate) {
			response.Fail(c, response.CodePhoneExist)
		} else {
			response.Fail(c, response.CodeServerBusy)
		}
		return
	}
	response.Success(c, nil)
}

func (u *userServerImpl) QueryUser(c *gin.Context) {
	var p param.QueryUserRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	user, err := u.user.QueryUser(c, &dto.QueryUserRequest{
		Phone:  p.Phone,
		UserId: p.UserId,
	})
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, user)
}

func (u *userServerImpl) UpdateUserInfo(c *gin.Context) {
	var p param.UpdateUserInfoRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	data, err := u.user.UpdateUserInfo(c, &dto.User{
		ID:        request.GetCurrentUser(c),
		Nickname:  p.Nickname,
		Avatar:    p.Avatar,
		Signature: p.Signature,
		Gender:    *p.Gender,
		Age:       *p.Age,
	})
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	response.Success(c, data)
}

func (u *userServerImpl) UpdateUserPassword(c *gin.Context) {
	var p param.UpdateUserPasswordRequest
	if err := c.ShouldBind(&p); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}
	ok, err := u.user.UpdateUserPassword(c, p.OldPassword, p.NewPassword)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	if !ok {
		response.Fail(c, response.CodeOldPasswordError)
		return
	}
	response.Success(c, nil)
}
