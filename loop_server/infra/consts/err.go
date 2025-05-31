package consts

import "errors"

var (
	ErrPartUserNotExist = errors.New("部分用户不存在")
	ErrNoPermission     = errors.New("无权限")
)

const (
	Duplicate = "Duplicate entry"
)
