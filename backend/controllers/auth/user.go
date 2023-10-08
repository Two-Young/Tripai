package auth

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func SignUp(c *gin.Context) {
	// not implemented
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func UseUserAuthRouter(g *gin.RouterGroup) {
	sg := g.Group("/user")
	sg.PUT("", SignUp)
}
