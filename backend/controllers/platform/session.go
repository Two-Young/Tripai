package platform

import (
	"database/sql"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
	"strings"
	"time"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"
	"travel-ai/service/platform/database_io"
	"travel-ai/third_party/pexels"
)

func Sessions(c *gin.Context) {
	rawUid, ok := c.Get("uid")
	if !ok {
		log.Error("uid not found")
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	uid := rawUid.(string)

	sessions := make([]database.SessionEntity, 0)
	if err := database.DB.Select(&sessions, "SELECT sessions.* "+
		"FROM sessions "+
		"LEFT JOIN user_sessions us ON sessions.sid = us.sid "+
		"WHERE us.uid = ?;", uid); err != nil {
		if err != sql.ErrNoRows {
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	}

	respItems := make(sessionsResponseDto, 0)
	for _, s := range sessions {
		countryCodes := make([]string, 0)
		if err := database.DB.Select(&countryCodes, "SELECT country_code FROM countries WHERE sid = ?;", s.SessionId); err != nil {
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		respItems = append(respItems, sessionsResponseItem{
			SessionId:     *s.SessionId,
			CreatorUserId: *s.CreatorUserId,
			Name:          *s.Name,
			StartAt:       s.StartAt.Format("2006-01-02"),
			EndAt:         s.EndAt.Format("2006-01-02"),
			CreatedAt:     s.CreatedAt.UnixMilli(),
			CountryCodes:  countryCodes,
			ThumbnailUrl:  *s.ThumbnailUrl,
		})
	}

	c.JSON(http.StatusOK, respItems)
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
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// check if country codes are valid
	regionMap := make(map[string]bool)
	for _, countryCode := range body.CountryCodes {
		country, ok := platform.CountriesMap[countryCode]
		if !ok {
			util2.AbortWithStrJson(c, http.StatusBadRequest, fmt.Sprintf("invalid country code: %s", countryCode))
			return
		}
		regionMap[country.Region] = true
	}

	// check if start_at and end_at are valid
	startAt, sErr := platform.ConvertDateString(body.StartAt)
	if sErr != nil {
		log.Error(sErr)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid start_at")
		return
	}
	endAt, eErr := platform.ConvertDateString(body.EndAt)
	if eErr != nil {
		log.Error(eErr)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid end_at")
		return
	}
	if startAt.After(endAt) {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "start_at should be before end_at")
		return
	}

	ctx, err := database.DB.BeginTxx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// get keys of regions
	regions := make([]string, 0)
	for region := range regionMap {
		regions = append(regions, region)
	}

	travelName := strings.Join(regions, ", ")
	if len(body.CountryCodes) == 1 {
		cc := body.CountryCodes[0]
		countryName, ok := platform.CountriesMap[cc]
		if !ok {
			log.Error("country not found")
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		travelName = countryName.CommonName
	}

	sessionId := uuid.New().String()
	sessionName := fmt.Sprintf("%s Travel", travelName)
	// get free image url with travel topic
	imageUrl, err := pexels.GetFreeImageUrlByKeyword(sessionName)
	if err != nil {
		log.Error(err)
		ctx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// create session entity
	// TODO :: set unit
	if _, err := ctx.Exec(
		"INSERT INTO sessions(sid, creator_uid, name, start_at, end_at, created_at, budget, unit, thumbnail_url) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)",
		sessionId, uid, sessionName, startAt, endAt, time.Now(), 0, "USD", imageUrl,
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

	// add user to session
	if _, err := ctx.Exec(
		"INSERT INTO user_sessions(sid, uid) VALUES(?, ?)",
		sessionId, uid,
	); err != nil {
		log.Error(err)
		ctx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err = ctx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusOK, sessionId)
}

func DeleteSession(c *gin.Context) {
	rawUid, ok := c.Get("uid")
	if !ok {
		log.Error("uid not found")
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	uid := rawUid.(string)

	var body sessionDeleteRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	ctx, err := database.DB.BeginTxx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// check if user has permission to delete session
	var creatorUid string
	if err := ctx.Get(
		&creatorUid,
		"SELECT creator_uid FROM sessions WHERE sid = ?",
		body.SessionId,
	); err != nil {
		ctx.Rollback()
		if err == sql.ErrNoRows {
			c.AbortWithStatus(http.StatusForbidden)
			return
		}
		log.Error(err)
		c.AbortWithStatus(http.StatusForbidden)
	}

	if uid != creatorUid {
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	// delete countries entity
	if _, err := ctx.Exec(
		"DELETE FROM countries WHERE sid = ?",
		body.SessionId,
	); err != nil {
		log.Error(err)
		ctx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete receipt items users
	if _, err := ctx.Exec(
		"DELETE receipt_items_users "+
			"FROM receipt_items_users "+
			"LEFT JOIN receipt_items ON receipt_items_users.riid = receipt_items.riid "+
			"LEFT JOIN receipts ON receipt_items.rid = receipts.rid "+
			"WHERE receipts.sid = ?;",
		body.SessionId,
	); err != nil {
		log.Error(err)
		ctx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete receipts entity
	if _, err := ctx.Exec(
		"DELETE FROM receipts WHERE sid = ?;",
		body.SessionId,
	); err != nil {
		log.Error(err)
		ctx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete schedules entity
	if _, err := ctx.Exec(
		"DELETE FROM schedules WHERE sid = ?;",
		body.SessionId,
	); err != nil {
		log.Error(err)
		ctx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete locations entity
	if _, err := ctx.Exec(
		"DELETE FROM locations WHERE sid = ?;",
		body.SessionId,
	); err != nil {
		log.Error(err)
		ctx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete user_sessions entity
	if _, err := ctx.Exec(
		"DELETE FROM user_sessions WHERE sid = ?;",
		body.SessionId,
	); err != nil {
		log.Error(err)
		ctx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete sessions entity
	if _, err := ctx.Exec(
		"DELETE FROM sessions WHERE sid = ?;",
		body.SessionId,
	); err != nil {
		log.Error(err)
		ctx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// commit
	if err = ctx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.Status(http.StatusOK)
}

func Currencies(c *gin.Context) {
	var query sessionSupportedCurrenciesRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	countriesEntities, err := database_io.GetCountriesBySessionId(query.SessionId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid session id")
		return
	}

	supportedCurrencies := make(sessionSupportedCurrenciesResponseDto)
	for _, currencyEntity := range countriesEntities {
		cca2 := currencyEntity.CountryCode
		if cca2 == nil {
			log.Debug("country code is nil")
			continue
		}
		country, ok := platform.CountriesMap[*cca2]
		if !ok {
			log.Debugf("country not found with cca2: %s", *cca2)
			continue
		}
		supportedCurrencies[country.CCA2] = make([]sessionSupportedCurrenciesResponseItem, 0)
		currencyList := supportedCurrencies[country.CCA2]

		for _, currency := range country.Currencies {
			currencyList = append(currencyList, sessionSupportedCurrenciesResponseItem{
				CurrencyCode:   currency.Code,
				CurrencyName:   currency.Name,
				CurrencySymbol: currency.Symbol,
			})
		}

		supportedCurrencies[country.CCA2] = currencyList
	}
	c.JSON(http.StatusOK, supportedCurrencies)
}

func UseSessionRouter(g *gin.RouterGroup) {
	rg := g.Group("/session")
	rg.GET("", Sessions)
	rg.PUT("", CreateSession)
	rg.DELETE("", DeleteSession)
	rg.GET("/currencies", Currencies)
}
