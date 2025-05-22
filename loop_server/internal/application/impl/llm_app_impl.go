package impl

import (
	"context"
	"loop_server/internal/domain"
)

type llmAppImpl struct {
	llm domain.LLMDomain
}

func NewLLMAppImpl(llm domain.LLMDomain) *llmAppImpl {
	return &llmAppImpl{
		llm: llm,
	}
}

func (llm *llmAppImpl) GenerateFromSinglePrompt(ctx context.Context, prompt string) (chan []byte, error) {
	return llm.llm.GenerateFromSinglePrompt(ctx, prompt), nil
}
