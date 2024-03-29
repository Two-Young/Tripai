package platform

import (
	"github.com/gin-gonic/gin"
	"travel-ai/controllers/middlewares"
)

func UsePlatformRouter(r *gin.Engine) {
	g := r.Group("/platform")
	UseVersionRouter(g)
	g.Use(middlewares.AuthMiddleware)
	UseLocateRouter(g)
	UseLocationRouter(g)
	UseScheduleRouter(g)
	UseSessionRouter(g)
	UseBudgetRouter(g)
	UseExpenditureRouter(g)
	UseSettlementRouter(g)
	UseCurrencyRouter(g)
	UseFriendsRouter(g)
	UseUserRouter(g)
}
