package po

import (
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"log/slog"
	"loop_server/internal/model/dto"
	"time"
)

type User struct {
	gorm.Model
	Nickname  string `gorm:"type:varchar(16);comment:昵称;not null"`
	Password  string `gorm:"type:varchar(64);comment:密码;not null"`
	Phone     string `gorm:"type:varchar(11);comment:电话;unique;not null"`
	Avatar    string `gorm:"type:varchar(256);comment:头像;not null"`
	Signature string `gorm:"type:varchar(256);comment:个性签名;not null"`
	Gender    int    `gorm:"type:tinyint;comment:性别：0-未知，1-男，2-女;not null"`
	Age       int    `gorm:"type:tinyint unsigned;comment:年龄;not null"`
}

func (*User) TableName() string {
	return "user"
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	pwd, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("model/po/user_server_impl.go BeforeCreate err:", err)
		return err
	}
	u.Password = string(pwd)
	return nil
}

func (u *User) ConvertToDto() *dto.User {
	var created *time.Time
	var updated *time.Time
	if !u.CreatedAt.IsZero() {
		created = &u.CreatedAt
	}
	if !u.UpdatedAt.IsZero() {
		updated = &u.UpdatedAt
	}
	return &dto.User{
		ID:        u.ID,
		CreatedAt: created,
		UpdatedAt: updated,
		Nickname:  u.Nickname,
		Password:  u.Password,
		Phone:     u.Phone,
		Avatar:    u.Avatar,
		Signature: u.Signature,
		Gender:    u.Gender,
		Age:       u.Age,
	}
}

func ConvertUserDtoToPo(u *dto.User) *User {
	var (
		created time.Time
		updated time.Time
	)
	if u.CreatedAt != nil {
		created = *u.CreatedAt
	}
	if u.UpdatedAt != nil {
		updated = *u.UpdatedAt
	}
	return &User{
		Model: gorm.Model{
			ID:        u.ID,
			CreatedAt: created,
			UpdatedAt: updated,
		},
		Nickname:  u.Nickname,
		Password:  u.Password,
		Phone:     u.Phone,
		Avatar:    u.Avatar,
		Signature: u.Signature,
		Age:       u.Age,
	}
}

func BatchConvertUserPoToDto(data []*User) []*dto.User {
	list := make([]*dto.User, len(data))
	for i, v := range data {
		list[i] = v.ConvertToDto()
	}
	return list
}
