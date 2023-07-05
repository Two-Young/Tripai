package controller

import (
	"github.com/gin-gonic/gin"
)

func AutoComplete(c *gin.Context) {
	// TODO :: implement this
}

func Location(c *gin.Context) {
	// TODO :: implement this
}

func Direction(c *gin.Context) {
	// TODO :: implement this
}

func CountryCode(c *gin.Context) {
	// TODO :: implement this
}

func UseLocateRouter(g *gin.RouterGroup) {
	rg := g.Group("/locate")
	rg.POST("/auto-complete", AutoComplete)
	rg.GET("/location", Location)
	rg.GET("/direction", Direction)
	rg.GET("/country-code", CountryCode)
}
