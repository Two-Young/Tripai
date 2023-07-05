package controller

import (
	"github.com/gin-gonic/gin"
	"io"
	"net/http"
	"travel-ai/third_party/open_ai/text_completion"
)

func TextCompletionSync(c *gin.Context) {
	var body textCompletionRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := text_completion.RequestCompletionSync(text_completion.MODEL_GPT_3_5_TURBO, text_completion.ROLE_USER, body.Prompt)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, resp)
}

func TextCompletion(c *gin.Context) {
	var body textCompletionRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	w := c.Writer
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Transfer-Encoding", "chunked")

	resp, err := text_completion.RequestCompletion(text_completion.MODEL_GPT_3_5_TURBO, text_completion.ROLE_USER, body.Prompt)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	_, err = io.Copy(c.Writer, resp)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.Status(http.StatusOK)
}

func UseTextCompletionRouter(g *gin.RouterGroup) {
	sg := g.Group("/text-completion")
	sg.POST("/textCompletionSync", TextCompletionSync)
	sg.POST("/textCompletion", TextCompletion)
}
