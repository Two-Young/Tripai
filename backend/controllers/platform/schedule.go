package platform

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"
	"github.com/google/uuid"
	"net/http"
	"travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"
	"travel-ai/service/platform/database_io"
)

func Schedules(c *gin.Context) {
	rawUid, ok := c.Get("uid")
	if !ok {
		log.Error("uid not found")
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	uid := rawUid.(string)

	var query schedulesRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	// check if user has permission to view locations
	yes, err := platform.DidParticipateInSession(uid, query.SessionId)
	if err != nil {
		log.Error(err)
		util.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	if !yes {
		util.AbortWithStrJson(c, http.StatusForbidden, "permission denied")
		return
	}

	// get schedules
	schedules, err := database_io.GetSchedulesByDayCode(query.SessionId, query.Day)
	if err != nil {
		log.Error(err)
		util.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	resp := make(schedulesResponseDto, 0)
	for _, s := range schedules {
		resp = append(resp, schedulesResponseItem{
			ScheduleId:     *s.ScheduleId,
			Name:           *s.Name,
			PhotoReference: *s.PhotoReference,
			PlaceId:        *s.PlaceId,
			Address:        *s.Address,
			StartAt:        s.StartAt.UnixMilli(),
		})
	}

	c.JSON(http.StatusOK, resp)
}

func CreateSchedule(c *gin.Context) {
	rawUid, ok := c.Get("uid")
	if !ok {
		log.Error("uid not found")
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	uid := rawUid.(string)

	var body scheduleCreateRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// validate body
	if body.Name == "" {
		util.AbortWithStrJson(c, http.StatusBadRequest, "name is required")
		return
	}

	// check if user has permission to create schedule
	yes, err := platform.DidParticipateInSession(uid, body.SessionId)
	if err != nil {
		log.Error(err)
		util.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	if !yes {
		util.AbortWithStrJson(c, http.StatusForbidden, "permission denied")
		return
	}

	// get session
	session, err := database_io.GetSession(body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// milliseconds to time
	startAt, err := platform.ConvertDateInt64(body.StartAt)
	if err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusBadRequest, "invalid start_at")
		return
	}

	// get day
	sessionStartDayCode := platform.GetDayCode(*session.StartAt)
	sessionEndDayCode := platform.GetDayCode(*session.EndAt)
	startAtDayCode := platform.GetDayCode(startAt)
	dayIndex := startAtDayCode - sessionStartDayCode + 1

	if startAtDayCode > sessionEndDayCode || startAtDayCode < sessionStartDayCode {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusBadRequest, "invalid start_at: out of session schedule range")
		return
	}

	// get place detail
	cache, err := database_io.GetPlaceDetailCache(c, body.PlaceId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	var placeId *string
	if body.PlaceId == "" {
		placeId = nil
	} else {
		placeId = &body.PlaceId
	}

	// create schedule entity
	scheduleId := uuid.New().String()
	if _, err := database.DB.Exec(
		"INSERT INTO schedules (sscid, name, photo_reference, place_id, address, day, start_at, sid) VALUES (?, ?, ?, ?, ?, ?, ?);",
		scheduleId, body.Name, cache.PhotoReference, placeId,
		cache.Address, dayIndex, startAt, body.SessionId,
	); err != nil {
		var mysqlErr *mysql.MySQLError
		if ok := errors.As(err, &mysqlErr); ok && mysqlErr.Number == 1062 {
			util.AbortWithStrJson(c, http.StatusConflict, "location already exists")
			return
		}
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
}

func DeleteSchedule(c *gin.Context) {
	rawUid, ok := c.Get("uid")
	if !ok {
		log.Error("uid not found")
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	uid := rawUid.(string)

	var body scheduleDeleteRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// get session id by schedule id
	schedule, err := database_io.GetSchedule(body.ScheduleId)
	if err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusBadRequest, "schedule not found")
		return
	}

	// check if user has permission to delete location
	yes, err := platform.DidParticipateInSession(uid, *schedule.SessionId)
	if err != nil {
		log.Error(err)
		util.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	if !yes {
		util.AbortWithStrJson(c, http.StatusForbidden, "permission denied")
		return
	}

	// delete schedule entity
	if _, err := database.DB.Exec(
		"DELETE FROM schedules WHERE sscid = ?;",
		body.ScheduleId,
	); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.Status(http.StatusOK)
}

func UseScheduleRouter(g *gin.RouterGroup) {
	rg := g.Group("/schedule")
	rg.GET("", Schedules)
	rg.PUT("", CreateSchedule)
	rg.DELETE("", DeleteSchedule)
}