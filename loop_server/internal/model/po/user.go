package po

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"log/slog"
	"loop_server/internal/model/dto"
)

type User struct {
	gorm.Model
	Nickname string `gorm:"column:nickname;comment:昵称;type:varchar(16)"`
	Password string `gorm:"column:password;comment:密码;type:varchar(64)"`
	Phone    string `gorm:"column:phone;comment:电话;type:varchar(11);unique"`
	Avatar   string `gorm:"column:avatar;comment:头像;type:varchar(256);"`
}

func (*User) TableName() string {
	return "user"
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	pwd, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("model/po/user.go BeforeCreate err:", err)
		return err
	}
	u.Password = string(pwd)
	return nil
}

func (u *User) ConvertDto() *dto.User {
	return &dto.User{
		Model:    u.Model,
		Nickname: u.Nickname,
		Password: u.Password,
		Phone:    u.Phone,
		Avatar:   u.Avatar,
	}
}

func ConvertUserDtoToPo(u *dto.User) *User {
	return &User{
		Model:    u.Model,
		Nickname: u.Nickname,
		Password: u.Password,
		Phone:    u.Phone,
		Avatar:   u.Avatar,
	}
}
