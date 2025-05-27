package jwt

import (
	"errors"
	"github.com/golang-jwt/jwt/v4"
	"time"
)

const (
	accessTokenExpireDuration  = time.Hour * 1      // Access Token有效期1小时
	refreshTokenExpireDuration = time.Hour * 24 * 7 // Refresh Token有效期7天
)

var (
	CustomSecret  = []byte("loop")
	RefreshSecret = []byte("loop-refresh") // 单独的Refresh Token密钥
)

type UserClaims struct {
	// 可根据需要自行添加字段
	ID uint `json:"id"`
}

type CustomClaims struct {
	UserClaims
	jwt.RegisteredClaims // 内嵌标准的声明
}

// TokenPair 包含Access Token和Refresh Token
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

// GenToken 生成双Token
func GenToken(Id uint) (*TokenPair, error) {
	user := UserClaims{
		ID: Id,
	}

	// 生成Access Token
	accessClaims := CustomClaims{
		user,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(accessTokenExpireDuration)),
			Issuer:    "my-project",
		},
	}
	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenStr, err := accessToken.SignedString(CustomSecret)
	if err != nil {
		return nil, err
	}

	// 生成Refresh Token
	refreshClaims := CustomClaims{
		user,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(refreshTokenExpireDuration)),
			Issuer:    "my-project-refresh",
		},
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenStr, err := refreshToken.SignedString(RefreshSecret)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessTokenStr,
		RefreshToken: refreshTokenStr,
	}, nil
}

// ParseAccessToken 解析Access Token
func ParseAccessToken(tokenString string) (*CustomClaims, error) {
	return parseToken(tokenString, CustomSecret)
}

// ParseRefreshToken 解析Refresh Token
func ParseRefreshToken(tokenString string) (*CustomClaims, error) {
	return parseToken(tokenString, RefreshSecret)
}

// 解析Token的通用方法
func parseToken(tokenString string, secret []byte) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		return secret, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// 需要Refresh的错误判断
func NeedTokenRefresh(err error) bool {
	if ve, ok := err.(*jwt.ValidationError); ok {
		// 检查是否是Expired签名错误
		if ve.Errors&jwt.ValidationErrorExpired != 0 {
			return true
		}
	}
	return false
}

// RefreshToken 刷新Token
func RefreshToken(refreshTokenStr string) (*TokenPair, error) {
	// 解析Refresh Token
	claims, err := ParseRefreshToken(refreshTokenStr)
	if err != nil {
		return nil, err
	}

	// 生成新的Token对
	return GenToken(claims.UserClaims.ID)
}
