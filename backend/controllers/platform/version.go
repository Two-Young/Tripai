package platform

import "github.com/gin-gonic/gin"

const VERSION = "0.3.2.207"

func Version(c *gin.Context) {
	c.JSON(200, VERSION)
}

func UseVersionRouter(g *gin.RouterGroup) {
	rg := g.Group("/version")
	rg.GET("", Version)
}
