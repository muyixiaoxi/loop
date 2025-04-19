package middleware

import (
	"errors"
	"github.com/gin-gonic/gin"
	"loop_server/infra/redis"
	"loop_server/infra/vars"
	"loop_server/pkg/jwt"
	"loop_server/pkg/request"
	"loop_server/pkg/response"
	"strings"
)

// JWTAuthMiddleware 基于JWT的认证中间件
func JWTAuthMiddleware() func(c *gin.Context) {
	return func(c *gin.Context) {
		var tokenString string

		// Try to get token from Authorization header first
		authHeader := c.Request.Header.Get("Authorization")
		if authHeader != "" {
			// 按空格分割
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		// If token not found in header, try to get it from query parameter
		if tokenString == "" {
			tokenString = c.Query("token")
		}

		// If still no token found, return error
		if tokenString == "" {
			response.Fail(c, response.CodeInvalidToken)
			c.Abort()
			return
		}

		if err := SetToken(c, tokenString); err != nil {
			response.Fail(c, response.CodeInvalidToken)
			c.Abort()
			return
		}

		c.Next()
	}
}

func SetToken(c *gin.Context, t string) error {
	// parts[1]是获取到的tokenString，我们使用之前定义好的解析JWT的函数来解析它
	mc, err := jwt.ParseToken(t)
	if err != nil {
		response.Fail(c, response.CodeInvalidToken)
		c.Abort()
		return errors.New("token error")
	}

	key := redis.GetTokenKey(mc.UserClaims.ID)
	token, err := vars.Redis.Get(c, key).Result()
	if err != nil || token != t {
		response.Fail(c, response.CodeInvalidToken)
		c.Abort()
		return errors.New("token error")
	}

	// 将当前请求的username信息保存到请求的上下文c上
	c.Set(request.CtxUserIDKey, mc.UserClaims.ID)
	return nil
}
