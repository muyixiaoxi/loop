package param

type Prompt struct {
	Prompt string `json:"prompt" binding:"required"`
}
