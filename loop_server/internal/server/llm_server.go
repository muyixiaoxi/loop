package server

import (
	"github.com/gin-gonic/gin"
)

type LLMServer interface {
	GenerateFromSinglePrompt(c *gin.Context)
}
