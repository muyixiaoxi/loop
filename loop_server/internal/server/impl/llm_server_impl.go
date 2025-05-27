package impl

import (
	"github.com/gin-gonic/gin"
	"loop_server/internal/application"
	"loop_server/internal/model/param"
	"loop_server/internal/server"
	"loop_server/pkg/response"
	"net/http"
)

type llmServerImpl struct {
	llm application.LLMApp
}

func NewLLmServerImpl(llm application.LLMApp) server.LLMServer {
	return &llmServerImpl{llm: llm}
}

func (llm *llmServerImpl) GenerateFromSinglePrompt(c *gin.Context) {
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")

	input := param.Prompt{}
	if err := c.ShouldBind(&input); err != nil {
		response.Fail(c, response.CodeInvalidParam)
		return
	}

	// 获取流通道和取消函数
	ch, cancel := llm.llm.GenerateFromSinglePrompt(c, input.Prompt)
	defer cancel() // 确保资源被释放

	// 正确处理客户端断开连接
	clientGone := c.Request.Context().Done()

	for {
		select {
		case data, ok := <-ch:
			if !ok {
				return // 流已关闭
			}

			// 使用 SSE 格式发送数据
			c.SSEvent("message", string(data))

			// 立即刷新输出
			if f, ok := c.Writer.(http.Flusher); ok {
				f.Flush()
			}

		case <-clientGone:
			// 客户端断开连接，取消流处理
			cancel()
			return
		}
	}
}
