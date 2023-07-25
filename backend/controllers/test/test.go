package test

import (
	"github.com/gin-gonic/gin"
	"travel-ai/controllers/util"
)

func ErrResponse(c *gin.Context) {
	util.AbortWithStrJson(c, 500, "Test Error")
}

func UseTestTestRouter(g *gin.RouterGroup) {
	sg := g.Group("/test")
	sg.POST("/err-response", ErrResponse)
}
