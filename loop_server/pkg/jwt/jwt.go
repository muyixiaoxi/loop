package jwt

import (
	"errors"
	"github.com/golang-jwt/jwt/v4"
	"time"
)

const (
	AccessTokenExpire  = time.Hour * 2      // Access Token 有效期 2 小时
	RefreshTokenExpire = time.Hour * 24 * 7 // Refresh Token 有效期 7 天
)

var (
	AccessTokenSecret  = []byte("loop-access")
	RefreshTokenSecret = []byte("loop-refresh")
)

type UserClaims struct {
	ID uint `json:"id"` // 用户ID
}

type tokenType int

const (
	AccessToken  tokenType = 0
	RefreshToken tokenType = 1
)

type CustomClaims struct {
	UserClaims
	jwt.RegisteredClaims
}

// 生成双 Token
func GenerateTokens(userID uint) (accessToken, refreshToken string, err error) {
	// 1. 生成 Access Token
	accessToken, err = GenerateToken(userID, AccessTokenExpire, AccessToken)
	if err != nil {
		return "", "", err
	}

	// 2. 生成 Refresh Token（单独用途，不包含用户敏感信息）
	refreshToken, err = GenerateToken(userID, RefreshTokenExpire, RefreshToken)
	return
}

// GenerateToken 生成单个 Token tokenType: 0-accessToken,1-refreshToken
func GenerateToken(userID uint, expireDuration time.Duration, tokenType tokenType) (string, error) {
	claims := CustomClaims{
		UserClaims: UserClaims{ID: userID},
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expireDuration)),
			Issuer:    "my-im-system",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	customSecret := AccessTokenSecret
	if tokenType == 1 {
		customSecret = RefreshTokenSecret
	}
	return token.SignedString(customSecret)
}

// 解析 Token
func ParseToken(tokenString string, tokenType tokenType) (*CustomClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
		customSecret := AccessTokenSecret
		if tokenType == 1 {
			customSecret = RefreshTokenSecret
		}
		return customSecret, nil
	})
	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("invalid token")
}

// 刷新 Access Token（校验 Refresh Token 后生成新 Access Token）
func RefreshAccessToken(refreshToken string) (newAccessToken string, err error) {
	// 1. 校验 Refresh Token 有效性
	claims, err := ParseToken(refreshToken, RefreshToken)
	if err != nil {
		return "", errors.New("invalid refresh token")
	}

	// 2. 生成新 Access Token
	return GenerateToken(claims.UserClaims.ID, AccessTokenExpire, AccessToken)
}
