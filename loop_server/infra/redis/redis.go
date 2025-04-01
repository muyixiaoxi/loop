package redis

import (
	"context"
	"fmt"
)

func GetTokenKey(ctx context.Context, id uint) string {
	return fmt.Sprintf("loop:user:%d:token:", id)
}
