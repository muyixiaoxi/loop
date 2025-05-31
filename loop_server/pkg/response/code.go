package response

type ResCode int64

const (
	CodeSuccess ResCode = 1000 + iota
	CodeServerBusy
	CodePhoneExist
	CodeInvalidParam
	CodePhoneOrPasswordError
	CodeInvalidToken
	CodeOldPasswordError
	CodePartUserNotExist
	CodeGroupUserExist
	CodeNoPermission
)

var codeMsgMap = map[ResCode]string{
	CodeSuccess:              "success",
	CodeServerBusy:           "服务繁忙",
	CodePhoneExist:           "手机号已被注册",
	CodeInvalidParam:         "无效的参数",
	CodePhoneOrPasswordError: "手机号或密码错误",
	CodeInvalidToken:         "无效的token",
	CodeOldPasswordError:     "原始密码错误",
	CodePartUserNotExist:     "部分用户不存在",
	CodeGroupUserExist:       "群组成员已存在",
	CodeNoPermission:         "没有权限",
}

func (c ResCode) Msg() string {
	msg, ok := codeMsgMap[c]
	if !ok {
		msg = codeMsgMap[CodeServerBusy]
	}
	return msg
}
