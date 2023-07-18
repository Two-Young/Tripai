package controller

import (
	"github.com/gin-gonic/gin"
	"travel-ai/controllers"
)

func UsePlatformRouter(r *gin.Engine) {
	g := r.Group("/platform")
	g.Use(controllers.AuthMiddleware)
	UseLocateRouter(g)
	UseSessionRouter(g)
	UseChatRouter(g)
	UseBudgetRouter(g)
}
