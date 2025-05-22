package application

import (
	"context"
)

type LLMApp interface {
	GenerateFromSinglePrompt(ctx context.Context, prompt string) (chan []byte, error)
}
