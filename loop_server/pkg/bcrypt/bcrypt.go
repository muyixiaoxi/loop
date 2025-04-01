package bcrypt

import (
	bcrypt2 "golang.org/x/crypto/bcrypt"
	"log/slog"
)

func GenerateFromPassword(password string) (string, error) {
	pwd, err := bcrypt2.GenerateFromPassword([]byte(password), bcrypt2.DefaultCost)
	if err != nil {
		slog.Error("model/po/user.go BeforeCreate err:", err)
		return "", err
	}
	return string(pwd), nil
}

func ComparePassword(old string, new string) bool {
	err := bcrypt2.CompareHashAndPassword([]byte(old), []byte(new))
	if err != nil {
		slog.Error("model/po/user.go ComparePassword err:", err)
	}
	return err == nil
}
