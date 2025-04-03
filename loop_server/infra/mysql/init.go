package mysql

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"log/slog"
	"loop_server/internal/model/po"
	"loop_server/pkg/settings"
)

func InitDB(m *settings.MySQLConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local", m.User, m.Password, m.Host, m.Port, m.DB)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		slog.Error("InitDB err:", err)
		return nil, err
	}

	return db, autoMigrate(db)
}

func autoMigrate(db *gorm.DB) error {
	// 指定需要迁移的模型
	models := []interface{}{
		&po.User{},
		&po.FriendShip{},
		&po.FriendRequest{},
		// 如果有其他模型，继续添加
		// &po.OtherModel{},
	}

	// 循环迁移所有模型
	for _, model := range models {
		if err := db.AutoMigrate(model); err != nil {
			return err
		}
	}

	return nil
}
