package test

import (
	"github.com/gin-gonic/gin"
	"net/http"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/third_party/fawazahmed0_currency"
)

type exchangeRateResponseDto struct {
	FromCurrencyCode string  `form:"from_currency_code" binding:"required"`
	ToCurrencyCode   string  `form:"to_currency_code" binding:"required"`
}

func ExchangeRate(c *gin.Context) {
	var query exchangeRateResponseDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	// temporary method
	rate, err := fawazahmed0_currency.GetExchangeRate(query.FromCurrencyCode, query.ToCurrencyCode)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusInternalServerError, "internal server error")
		return
	}

	c.JSON(http.StatusOK, rate)
}

func UseTestCurrencyRouter(g *gin.RouterGroup) {
	sg := g.Group("/currency")
	sg.GET("/exchange-rate", ExchangeRate)
}
