package po

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"log/slog"
	"loop_server/internal/model/dto"
)

type User struct {
	gorm.Model
	Nickname string `gorm:"comment:昵称;type:varchar(16);not null"`
	Password string `gorm:"comment:密码;type:varchar(64);not null"`
	Phone    string `gorm:"comment:电话;type:varchar(11);unique;not null"`
	Avatar   string `gorm:"comment:头像;type:varchar(256);not null"`
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

func (u *User) ConvertToDto() *dto.User {
	return &dto.User{
		ID:        u.ID,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
		Nickname:  u.Nickname,
		Password:  u.Password,
		Phone:     u.Phone,
		Avatar:    u.Avatar,
	}
}

func ConvertUserDtoToPo(u *dto.User) *User {
	return &User{
		Model: gorm.Model{
			ID:        u.ID,
			CreatedAt: u.CreatedAt,
			UpdatedAt: u.UpdatedAt,
		},
		Nickname: u.Nickname,
		Password: u.Password,
		Phone:    u.Phone,
		Avatar:   u.Avatar,
	}
}

func BatchConvertUserPoToDto(data []*User) []*dto.User {
	list := make([]*dto.User, len(data))
	for i, v := range data {
		list[i] = v.ConvertToDto()
	}
	return list
}
