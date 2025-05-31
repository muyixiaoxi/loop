package impl

import (
	"context"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/openai"
	"log/slog"
	"loop_server/infra/consts"
)

type LLMDomainImpl struct {
	llm *openai.LLM
}

func NewLLMDomainImpl(llm *openai.LLM) *LLMDomainImpl {
	return &LLMDomainImpl{
		llm: llm,
	}
}

func (l *LLMDomainImpl) GenerateFromSinglePrompt(ctx context.Context, prompt string) (chan []byte, context.CancelFunc) {
	ch := make(chan []byte)
	ctx, cancel := context.WithCancel(ctx)

	content := []llms.MessageContent{
		llms.TextParts(llms.ChatMessageTypeSystem, consts.PromptAnswer),
		llms.TextParts(llms.ChatMessageTypeHuman, prompt),
	}

	go func() {
		defer close(ch)
		_, err := l.llm.GenerateContent(ctx, content, llms.WithStreamingFunc(func(ctx context.Context, chunk []byte) error {
			if len(chunk) == 0 {
				return nil
			}

			// 使用带超时的发送，防止 goroutine 泄漏
			select {
			case ch <- chunk:
				return nil
			case <-ctx.Done():
				return ctx.Err()
			}
		}))

		if err != nil {
			slog.Error("LLMDomainImpl.GenerateFromSinglePrompt err:", err)
		}
	}()

	return ch, cancel
}
