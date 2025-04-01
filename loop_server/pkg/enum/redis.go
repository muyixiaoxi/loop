package enum

import "fmt"

func RedisTokenCacheKey(userId uint) string {
	return fmt.Sprintf("user:%d:token", userId)
}
