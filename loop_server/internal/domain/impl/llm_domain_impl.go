package impl

import (
	"context"
	"fmt"
	"github.com/tmc/langchaingo/llms"
	"github.com/tmc/langchaingo/llms/openai"
)

type LLMDomainImpl struct {
	llm *openai.LLM
}

func NewLLMDomainImpl(llm *openai.LLM) *LLMDomainImpl {
	return &LLMDomainImpl{
		llm: llm,
	}
}

func (l *LLMDomainImpl) GenerateFromSinglePrompt(ctx context.Context, prompt string) chan []byte {
	ch := make(chan []byte)
	go func() {
		_, err := llms.GenerateFromSinglePrompt(ctx, l.llm, prompt, llms.WithStreamingFunc(func(ctx context.Context, chunk []byte) error {
			if len(chunk) == 0 {
				return nil
			}
			fmt.Print(string(chunk))
			ch <- chunk
			return nil
		}))
		if err != nil {
			return
		}
		close(ch)
	}()

	return ch
}
