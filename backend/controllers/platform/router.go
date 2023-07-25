package platform

import (
	"github.com/gin-gonic/gin"
	"travel-ai/controllers/middlewares"
)

func UsePlatformRouter(r *gin.Engine) {
	g := r.Group("/platform")
	g.Use(middlewares.AuthMiddleware)
	UseLocateRouter(g)
	UseLocationRouter(g)
	UseSessionRouter(g)
	UseChatRouter(g)
	UseBudgetRouter(g)
}
