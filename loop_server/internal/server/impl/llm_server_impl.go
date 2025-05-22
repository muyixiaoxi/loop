package impl

import (
	"github.com/gin-gonic/gin"
	"loop_server/internal/application"
	"loop_server/internal/model/param"
	"loop_server/internal/server"
	"loop_server/pkg/response"
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

	ch, err := llm.llm.GenerateFromSinglePrompt(c, input.Prompt)
	if err != nil {
		response.Fail(c, response.CodeServerBusy)
		return
	}
	for {
		select {
		case <-c.Request.Context().Done():
			return
		default:
			data, ok := <-ch
			if !ok {
				return
			}
			c.SSEvent("message", string(data))
		}
	}
}
