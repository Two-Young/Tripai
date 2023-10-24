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

func Expenditures(c *gin.Context) {
	uid := c.GetString("uid")

	var query ExpenditureGetRequestDto
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

	expenditureEntities, err := database_io.GetExpendituresBySessionId(query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	expenditures := make(ExpenditureGetResponseDto, 0)
	for _, e := range expenditureEntities {
		expenditures = append(expenditures, ExpenditureGetResponseItem{
			ExpenditureId: e.ExpenditureId,
			Name:          e.Name,
			TotalPrice:    e.TotalPrice,
			CurrencyCode:  e.CurrencyCode,
			Category:      e.Category,
			IsCustom:      e.IsCustom,
		})
	}

	c.JSON(http.StatusOK, expenditures)
}

func CreateExpenditure(c *gin.Context) {
	uid := c.GetString("uid")

	var body ExpenditureCreateRequestDto
	if err := c.ShouldBindQuery(&body); err != nil {
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

	tx, err := database.DB.Begin()
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	expenditureId := uuid.New().String()
	if err := database_io.InsertExpenditureTx(tx, database.ExpenditureEntity{
		ExpenditureId: expenditureId,
		Name:          body.Name,
		TotalPrice:    body.TotalPrice,
		CurrencyCode:  body.CurrencyCode,
		Category:      body.Category,
		IsCustom:      body.IsCustom,
		SessionId:     body.SessionId,
	}); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusOK, nil)
}

func DeleteExpenditure(c *gin.Context) {
	uid := c.GetString("uid")

	var body ExpenditureDeleteRequestDto
	if err := c.ShouldBindQuery(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	// get expenditure
	expenditureEntity, err := database_io.GetExpenditure(body.ExpenditureId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "expenditure does not exist")
		return
	}

	// check if session exists
	sessionEntity, err := database_io.GetSession(expenditureEntity.SessionId)
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

	tx, err := database.DB.Begin()
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err := database_io.DeleteExpenditureTx(tx, body.ExpenditureId); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusOK, nil)
}

func UseExpenditureRouter(g *gin.RouterGroup) {
	rg := g.Group("/expenditure")
	rg.GET("", Expenditures)
	rg.PUT("", CreateExpenditure)
	rg.DELETE("", DeleteExpenditure)
}
