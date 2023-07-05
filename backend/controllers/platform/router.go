package controller

import (
	"github.com/gin-gonic/gin"
)

func UsePlatformRouter(r *gin.Engine) {
	g := r.Group("/platform")
	UseLocateRouter(g)
	UseSessionRouter(g)
	UseChatRouter(g)
	UseBudgetRouter(g)
}
