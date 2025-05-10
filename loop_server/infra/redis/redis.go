package redis

import (
	"fmt"
)

func GetTokenKey(id uint) string {
	return fmt.Sprintf("loop:user:%d:token", id)
}

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
