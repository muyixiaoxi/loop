package request

import (
	"context"
	"errors"
	"github.com/gin-gonic/gin"
)

const CtxUserIDKey = "userID"

var ErrorUserNotLogin = errors.New("用户未登录")

func GetCurrentUser(ctx context.Context) (userID uint) {
	c, _ := ctx.(*gin.Context)
	uid, _ := c.Get(CtxUserIDKey)
	userID, _ = uid.(uint)
	return
}
