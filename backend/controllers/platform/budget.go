package controller

import (
	"github.com/gin-gonic/gin"
)

func Budgets(c *gin.Context) {
	// TODO :: implement this
	// TODO :: return budget list for user
}

func CreateBudget(c *gin.Context) {
	// TODO :: implement this
}

func DeleteBudget(c *gin.Context) {
	// TODO :: implement this
}

func UseBudgetRouter(g *gin.RouterGroup) {
	rg := g.Group("/budget")
	rg.GET("/list", Budgets)
	rg.PUT("/create", CreateBudget)
	rg.DELETE("/delete", DeleteBudget)
}
