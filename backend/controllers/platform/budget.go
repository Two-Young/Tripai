package platform

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"
	"travel-ai/service/platform/database_io"
)

func Budgets(c *gin.Context) {
	uid := c.GetString("uid")

	var body BudgetGetRequestDto
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

	budgetEntities, err := database_io.GetBudgetsBySessionId(body.SessionId)
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

	// validate amount
	if body.Amount < 0 {
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
		Amount:       body.Amount,
	}); err != nil {
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

func UseBudgetRouter(g *gin.RouterGroup) {
	rg := g.Group("/budget")
	rg.GET("", Budgets)
	rg.PUT("", CreateBudget)
	rg.DELETE("", DeleteBudget)
}
