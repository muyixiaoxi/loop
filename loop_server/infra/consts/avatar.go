package consts

import "math/rand"

var (
	defaultAvatar = [4]string{
		"https://loopavatar.oss-cn-beijing.aliyuncs.com/1745828429471.jpeg",
		"https://loopavatar.oss-cn-beijing.aliyuncs.com/1745828432080.jpeg",
		"https://loopavatar.oss-cn-beijing.aliyuncs.com/1745828433975.jpeg",
	}
)

func GetDefaultAvatar() string {
	return defaultAvatar[rand.Intn(4)]
}
