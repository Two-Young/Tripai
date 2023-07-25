package test

import (
	"github.com/gin-gonic/gin"
)

func UseTestRouter(r *gin.Engine) {
	g := r.Group("/test")
	UseTestTestRouter(g)
	UseTextCompletionRouter(g)
	UseCloudVisionRouter(g)
	UseRoutesRouter(g)
}
