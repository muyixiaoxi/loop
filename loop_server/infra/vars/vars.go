package vars

import (
	"github.com/go-redis/redis/v8"
	"log/slog"
	redis2 "loop_server/infra/redis"
	"loop_server/pkg/settings"
)

var Redis *redis.Client

var App *settings.AppConfig

func init() {
	// 加载配置
	var err error
	App, err = settings.Init()
	if err != nil {
		slog.Error("settings.Init() err:", err)
		return
	}
	Redis = redis2.InitRDB(App.RedisConfig)
}
