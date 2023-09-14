package middlewares

import (
	"github.com/gin-gonic/gin"
)

func DefaultMiddleware(c *gin.Context) {
	// log.Debug(c.Request.Method, c.Request.URL.String())
	c.Next()
}
