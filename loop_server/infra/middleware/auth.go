package middleware

import (
	"context"
	"errors"
	"github.com/gin-gonic/gin"
	"loop_server/infra/redis"
	"loop_server/infra/vars"
	"loop_server/pkg/jwt"
	"loop_server/pkg/request"
	"loop_server/pkg/response"
	"strings"
)

// JWTAuthMiddleware 双Token认证中间件
func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. 优先从Header获取Access Token
		accessToken := extractAccessToken(c)
		if accessToken == "" {
			response.Fail(c, response.CodeInvalidToken)
			c.Abort()
			return
		}

		// 2. 验证Access Token
		claims, err := validateAccessToken(c, accessToken)
		if err != nil {
			response.Fail(c, response.CodeInvalidToken)
			c.Abort()
			return
		}
		// Token有效，继续流程
		c.Set(request.CtxUserIDKey, claims.UserClaims.ID)
		c.Next()
	}
}

// 从请求中提取Access Token
func extractAccessToken(c *gin.Context) string {
	// 1. 从Authorization头获取
	if authHeader := c.GetHeader("Authorization"); authHeader != "" {
		if parts := strings.Split(authHeader, " "); len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}

	// 2. 从查询参数获取（可选，生产环境建议禁用）
	return c.Query("token")
}

// 验证Access Token有效性
func validateAccessToken(c *gin.Context, token string) (*jwt.CustomClaims, error) {
	// 1. 解析Token
	claims, err := jwt.ParseToken(token, jwt.AccessToken)
	if err != nil {
		return nil, err
	}

	// 2. 检查Redis中的Access Token是否匹配
	storedToken, err := vars.Redis.Get(c, redis.GetAccessTokenKey(claims.UserClaims.ID)).Result()
	if err != nil || storedToken != token {
		return nil, errors.New("token revoked")
	}

	return claims, nil
}

// 尝试用Refresh Token刷新Access Token
func TryRefreshToken(c context.Context, refreshToken string) (string, error) {

	// 1. 验证Refresh Token有效性
	claims, err := jwt.ParseToken(refreshToken, jwt.RefreshToken)
	if err != nil {
		return "", errors.New("invalid refresh token")
	}

	// 2. 检查Redis中的Refresh Token是否匹配
	storedRefresh, err := vars.Redis.Get(c, redis.GetRefreshTokenKey(claims.UserClaims.ID)).Result()
	if err != nil || storedRefresh != refreshToken {
		return "", errors.New("refresh token revoked")
	}

	// 3. 生成新Access Token
	newAccessToken, err := jwt.GenerateToken(claims.UserClaims.ID, jwt.AccessTokenExpire, jwt.AccessToken)
	if err != nil {
		return "", errors.New("generate token failed")
	}

	// 4. 更新Redis中的Access Token
	if err := vars.Redis.Set(c, redis.GetAccessTokenKey(claims.UserClaims.ID), newAccessToken, jwt.AccessTokenExpire).Err(); err != nil {
		return "", errors.New("store token failed")
	}

	return newAccessToken, nil
}
