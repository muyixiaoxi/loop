package middleware

import (
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
		// 客户端携带Token有三种方式 1.放在请求头 2.放在请求体 3.放在URI
		// 这里假设Token放在Header的Authorization中，并使用Bearer开头
		// 这里的具体实现方式要依据你的实际业务情况决定
		authHeader := c.Request.Header.Get("Authorization")
		if authHeader == "" {
			response.Fail(c, response.CodeInvalidToken)
			c.Abort()
			return
		}
		// 按空格分割
		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			response.Fail(c, response.CodeInvalidToken)
			c.Abort()
			return
		}
		// parts[1]是获取到的tokenString，我们使用之前定义好的解析JWT的函数来解析它
		mc, err := jwt.ParseToken(parts[1])
		if err != nil {
			response.Fail(c, response.CodeInvalidToken)
			c.Abort()
			return
		}

		key := redis.GetTokenKey(c, mc.UserClaims.ID)
		token, err := vars.Redis.Get(c, key).Result()
		if err != nil || token != parts[1] {
			response.Fail(c, response.CodeInvalidToken)
			c.Abort()
			return
		}

		// 将当前请求的username信息保存到请求的上下文c上
		c.Set(request.CtxUserIDKey, mc.UserClaims.ID)

		c.Next() // 后续的处理函数可以用过c.Get("username")来获取当前请求的用户信息
	}
}
