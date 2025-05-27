package domain

import (
	"context"
)

type LLMDomain interface {
	GenerateFromSinglePrompt(ctx context.Context, prompt string) (chan []byte, context.CancelFunc)
}
