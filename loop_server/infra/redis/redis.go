package redis

import (
	"fmt"
)

func GetOnlineUserKey() string {
	return fmt.Sprintf("loop:online_users")
}

func GetUserChatKey(id uint) string {
	return fmt.Sprintf("loop:user:%d:chat", id)
}

func GetGroupAckListKey(userId uint, group uint) string {
	return fmt.Sprintf("loop:ack:%d:%d:message_list", userId, group)
}

func GetGroupAckStatusKey(userId uint, group uint) string {
	return fmt.Sprintf("loop:ack:%d:%d:message_status", userId, group)
}

func GetAccessTokenKey(userID uint) string {
	return fmt.Sprintf("loop:%s:%d", "access_token", userID)
}

func GetRefreshTokenKey(userID uint) string {
	return fmt.Sprintf("loop:%s:%d", "refresh_token", userID)
}
