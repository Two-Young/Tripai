package controller

import (
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
	"strings"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"
	"travel-ai/util"
)

func Sessions(c *gin.Context) {
	// TODO :: implement this
	// TODO :: return session list for user
}

func CreateSession(c *gin.Context) {
	rawUid, ok := c.Get("uid")
	if !ok {
		log.Error("uid not found")
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	uid := rawUid.(string)

	var body sessionCreateRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, errors.New("invalid request body"))
		return
	}

	// check if country codes are valid
	regions := make([]string, 0)
	for _, countryCode := range body.CountryCodes {
		country, ok := platform.CountriesMap[countryCode]
		if !ok {
			c.AbortWithError(http.StatusBadRequest, errors.New("invalid country code"))
			return
		}
		regions = append(regions, country.Region)
	}

	// check if start_at and end_at are valid
	startAt, sErr := platform.ValidateDateString(body.StartAt)
	if sErr != nil {
		c.AbortWithError(http.StatusBadRequest, errors.New("invalid start_at"))
		return
	}
	endAt, eErr := platform.ValidateDateString(body.EndAt)
	if eErr != nil {
		c.AbortWithError(http.StatusBadRequest, errors.New("invalid end_at"))
		return
	}
	if startAt.After(endAt) {
		c.AbortWithError(http.StatusBadRequest, errors.New("start_at should be before end_at"))
		return
	}

	ctx, err := database.DB.BeginTxx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// create session entity
	sessionId := uuid.New().String()
	sessionName := fmt.Sprintf("%s Travel", strings.Join(regions, ", "))
	if _, err := ctx.Exec(
		"INSERT INTO sessions(sid, creator_uid, name, start_at, end_at, created_at, budget, unit) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
		sessionId, uid, sessionName, startAt, endAt, util.CurrentTimeMillis(), 0, "USD",
	); err != nil {
		log.Error(err)
		ctx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// create session_countries entities
	for _, countryCode := range body.CountryCodes {
		sessionCountryId := uuid.New().String()
		if _, err := ctx.Exec(
			"INSERT INTO countries(scid, country_code, sid, airline_reserve_url) VALUES(?, ?, ?, ?)",
			sessionCountryId, countryCode, sessionId, nil,
		); err != nil {
			log.Error(err)
			ctx.Rollback()
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	}

	if err = ctx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusOK, sessionId)
}

func DeleteSession(c *gin.Context) {
	// TODO :: implement this
}

func UseSessionRouter(g *gin.RouterGroup) {
	rg := g.Group("/session")
	rg.GET("/list", Sessions)
	rg.PUT("/create", CreateSession)
	rg.DELETE("/delete", DeleteSession)
}
