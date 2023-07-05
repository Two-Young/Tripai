package controller

import (
	"github.com/gin-gonic/gin"
)

func Sessions(c *gin.Context) {
	// TODO :: implement this
	// TODO :: return session list for user
}

func CreateSession(c *gin.Context) {
	// TODO :: implement this
}

func DeleteSession(c *gin.Context) {
	// TODO :: implement this
}

func UseSessionRouter(g *gin.RouterGroup) {
	rg := g.Group("/session")
	rg.GET("/list", Sessions)
	rg.PUT("/create", CreateSession)
	rg.DELETE("/delete", DeleteSession)
}
