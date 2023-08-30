package platform

import (
	"github.com/gin-gonic/gin"
	"net/http"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/platform"
	"travel-ai/third_party/fawazahmed0_currency"
)

func SupportedCurrencies(c *gin.Context) {
	supportedCurrencies := make(currencyGetSupportedResponseDto, 0)
	for _, country := range platform.CountriesMap {
		for _, currency := range country.Currencies {
			supportedCurrencies = append(supportedCurrencies, currencyGetSupportedResponseItem{
				CountryCode:    country.CCA2,
				CurrencyCode:   currency.Code,
				CurrencyName:   currency.Name,
				CurrencySymbol: currency.Symbol,
			})
		}
	}

	c.JSON(http.StatusOK, supportedCurrencies)
}

func ExchangeRate(c *gin.Context) {
	var query currencyExchangeRateRequestDto
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

func UseCurrencyRouter(g *gin.RouterGroup) {
	rg := g.Group("/currency")
	rg.GET("", SupportedCurrencies)
	rg.GET("/exchange-rate", ExchangeRate)
}
