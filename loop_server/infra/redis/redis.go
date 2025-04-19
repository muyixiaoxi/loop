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
