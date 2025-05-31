package response

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

type resp struct {
	Code ResCode     `json:"code"`
	Msg  interface{} `json:"msg"`
	Data interface{} `json:"data,omitempty"`
}

func Fail(c *gin.Context, code ResCode) {
	c.JSON(http.StatusOK, &resp{
		Code: code,
		Msg:  code.Msg(),
		Data: nil,
	})
}

func FailWithMsg(c *gin.Context, code ResCode, msg interface{}) {
	c.JSON(http.StatusOK, &resp{
		Code: code,
		Msg:  msg,
		Data: nil,
	})
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, &resp{
		Code: CodeSuccess,
		Msg:  CodeSuccess.Msg(),
		Data: data,
	})
}
