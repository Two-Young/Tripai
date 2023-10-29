package platform

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"math/big"
	"net/http"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"
	"travel-ai/service/platform/database_io"
)

func Budgets(c *gin.Context) {
	uid := c.GetString("uid")

	var query BudgetGetRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query: "+err.Error())
		return
	}

	// check if session exists
	_, err := database_io.GetSession(query.SessionId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "session does not exist")
		return
	}

	// check if user is in session
	yes, err := platform.IsSessionMember(uid, query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "user is not in session")
		return
	}

	budgetEntities, err := database_io.GetBudgetsBySessionId(query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	budgets := make(BudgetGetResponseDto, len(budgetEntities))
	for i, budgetEntity := range budgetEntities {
		budgets[i] = BudgetGetResponseItem{
			BudgetId:     budgetEntity.BudgetId,
			CurrencyCode: budgetEntity.CurrencyCode,
			Amount:       budgetEntity.Amount,
		}
	}

	c.JSON(http.StatusOK, budgets)
}

func CreateBudget(c *gin.Context) {
	uid := c.GetString("uid")

	var body BudgetCreateRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	// check if session exists
	_, err := database_io.GetSession(body.SessionId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "session does not exist")
		return
	}

	// check if user is in session
	yes, err := platform.IsSessionMember(uid, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "user is not in session")
		return
	}

	// is currency code valid
	currencies, err := platform.GetSupportedSessionCurrencies(body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if _, ok := currencies[body.CurrencyCode]; !ok {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid currency code")
		return
	}

	if body.Amount == nil {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "amount is required")
		return
	}

	// validate amount
	if *body.Amount < 0 {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "amount should be positive")
		return
	}

	tx, err := database.DB.BeginTx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	budgetId := uuid.New().String()
	if err := database_io.InsertBudgetTx(tx, database.BudgetEntity{
		BudgetId:     budgetId,
		CurrencyCode: body.CurrencyCode,
		Amount:       *body.Amount,
		SessionId:    body.SessionId,
	}); err != nil {
		_ = tx.Rollback()
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, nil)
}

func EditBudget(c *gin.Context) {
	// TODO :: implement
}

func DeleteBudget(c *gin.Context) {
	uid := c.GetString("uid")

	var body BudgetDeleteRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	// get budget
	budgetEntity, err := database_io.GetBudget(body.BudgetId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "budget does not exist")
		return
	}

	// check if session exists
	sessionEntity, err := database_io.GetSession(budgetEntity.SessionId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "session does not exist")
		return
	}

	// check if user is in session
	yes, err := platform.IsSessionMember(uid, sessionEntity.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "user is not in session")
		return
	}

	// delete
	tx, err := database.DB.BeginTx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err := database_io.DeleteBudgetTx(tx, body.BudgetId); err != nil {
		_ = tx.Rollback()
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, nil)
}

func BudgetSummary(c *gin.Context) {
	uid := c.GetString("uid")

	var query BudgetSummaryGetRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query: "+err.Error())
		return
	}

	// get currency code
	userEntity, err := database_io.GetUser(uid)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	currencyCode := userEntity.DefaultCurrencyCode
	ok, err := platform.IsSupportedCurrency(currencyCode)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !ok {
		util2.AbortWithStrJsonF(c, http.StatusBadRequest, "invalid currency code: %s", currencyCode)
		return
	}

	// get budgets
	budgetEntities, err := database_io.GetBudgetsBySessionId(query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	totalBudget := 0.0
	for _, budgetEntity := range budgetEntities {
		amount := budgetEntity.Amount
		exchanged, err := platform.Exchange(budgetEntity.CurrencyCode, currencyCode, amount)
		if err != nil {
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		totalBudget += exchanged
	}

	// get expenditure distributions
	dists, err := database_io.GetExpenditureDistributionsBySessionIdAndUserId(query.SessionId, uid)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// get total spent
	totalSpent := 0.0
	spentByDay := make(map[string]float64)
	for _, dist := range dists {
		amount, ok := big.NewRat(dist.Numerator, dist.Denominator).Float64()
		if !ok {
			log.Errorf("failed to convert big.Rat to float64: %s", dist)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		exchanged, err := platform.Exchange(dist.CurrencyCode, currencyCode, amount)
		if err != nil {
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		totalSpent += exchanged

		// add to spend by day
		dayString := platform.ToDayString(dist.PayedAt) // 2020-01-01
		if _, ok := spentByDay[dayString]; !ok {
			spentByDay[dayString] = 0
		}
		spentByDay[dayString] += exchanged
	}

	resp := BudgetSummaryGetResponseDto{
		TotalBudget:  totalBudget,
		TotalSpent:   totalSpent,
		CurrencyCode: currencyCode,
		SpentByDay:   spentByDay,
	}
	c.JSON(http.StatusOK, resp)
}

func UseBudgetRouter(g *gin.RouterGroup) {
	rg := g.Group("/budget")
	rg.GET("", Budgets)
	rg.PUT("", CreateBudget)
	rg.POST("", EditBudget)
	rg.DELETE("", DeleteBudget)
	rg.GET("/summary", BudgetSummary)
}
