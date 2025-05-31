package llm

import (
	"github.com/tmc/langchaingo/llms/openai"
	"loop_server/pkg/settings"
)

func InitLLM(o *settings.OpenaiConfig) (*openai.LLM, error) {
	llm, err := openai.New(
		openai.WithModel(o.Model),
		openai.WithToken(o.Token),
		openai.WithBaseURL(o.URL),
	)
	return llm, err
}
