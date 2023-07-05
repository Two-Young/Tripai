package controller

import (
	"github.com/gin-gonic/gin"
)

func UseTestRouter(r *gin.Engine) {
	g := r.Group("/test")
	UseTextCompletionRouter(g)
	UseCloudVisionRouter(g)
	UseRoutesRouter(g)
}
