package platform

import (
	"database/sql"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"net/http"
	"sort"
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
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

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
			SessionId:     s.SessionId,
			SessionCode:   s.SessionCode,
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
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

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

	tx, err := database.DB.BeginTx(c, nil)
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
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// create session entity
	if err := database_io.InsertSessionTx(tx, database.SessionEntity{
		SessionId:     sessionId,
		SessionCode:   platform.GenerateTenLengthCode(),
		CreatorUserId: &uid,
		Name:          &sessionName,
		StartAt:       &startAt,
		EndAt:         &endAt,
		CreatedAt:     time.Now(),
		ThumbnailUrl:  &imageUrl,
	}); err != nil {
		log.Error(err)
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// create session_countries entities
	for _, countryCode := range body.CountryCodes {
		sessionCountryId := uuid.New().String()
		if _, err := tx.Exec(
			"INSERT INTO countries(scid, country_code, sid, airline_reserve_url) VALUES(?, ?, ?, ?)",
			sessionCountryId, countryCode, sessionId, nil,
		); err != nil {
			log.Error(err)
			_ = tx.Rollback()
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	}

	// add user to session
	if err := database_io.InsertUserToSessionTx(tx, database.UserSessionEntity{
		SessionId: sessionId,
		UserId:    uid,
		JoinedAt:  time.Now(),
	}); err != nil {
		log.Error(err)
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err = tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusOK, sessionId)
}

func DeleteSession(c *gin.Context) {
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

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

func InviteSession(c *gin.Context) {
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	var body sessionInviteRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// get session entity
	sessionEntity, err := database_io.GetSession(body.SessionId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid session id")
		return
	}

	// check if user has permission to invite
	if sessionEntity.CreatorUserId == nil {
		log.Error("creator user id is nil")
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if uid == body.TargetUserId {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: you cannot invite yourself")
		return
	}

	if uid != *sessionEntity.CreatorUserId {
		util2.AbortWithStrJson(c, http.StatusForbidden, "permission denied: you are not owner of this session")
		return
	}

	yes, err := platform.IsSessionMember(body.TargetUserId, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: target user is already member of this session")
		return
	}

	// check already invited
	yes, err = platform.IsWaitingForSessionInvitation(body.TargetUserId, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: target user already received invitation to this session")
		return
	}

	// check already requested
	alreadyRequested, err := platform.IsWaitingForSessionJoinRequestConfirm(body.TargetUserId, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	tx, err := database.DB.BeginTx(c, nil)

	if alreadyRequested {
		// delete requests
		if err := database_io.DeleteSessionJoinRequestTx(tx, database.SessionJoinRequestEntity{
			SessionId:   body.SessionId,
			UserId:      body.TargetUserId,
			RequestedAt: time.Now(),
		}); err != nil {
			log.Error(err)
			_ = tx.Rollback()
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		// add user to session
		if err := database_io.InsertUserToSessionTx(tx, database.UserSessionEntity{
			SessionId: body.SessionId,
			UserId:    body.TargetUserId,
			JoinedAt:  time.Now(),
		}); err != nil {
			log.Error(err)
			_ = tx.Rollback()
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	} else {
		// add invitation
		if err := database_io.InsertSessionInvitationTx(tx, database.SessionInvitationEntity{
			SessionId: body.SessionId,
			UserId:    body.TargetUserId,
			InvitedAt: time.Now(),
		}); err != nil {
			log.Error(err)
			_ = tx.Rollback()
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.Status(http.StatusOK)
}

// SessionInviteWaitings 특정 세션이 대기 중인 유저 초대 목록
func SessionInviteWaitings(c *gin.Context) {
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	var query sessionInviteWaitingRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	// check if user has permission to see waiting list
	yes, err := platform.IsSessionMember(uid, query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusForbidden, "permission denied: you are not member of this session")
		return
	}

	invitees, err := database_io.GetWaitingSessionInvitedUsers(query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	resp := make(sessionInviteWaitingResponseDto, 0)
	for _, invitee := range invitees {
		resp = append(resp, sessionInviteWaitingResponseItem{
			UserId:       invitee.UserId,
			Username:     *invitee.Username,
			ProfileImage: *invitee.ProfileImage,
			InvitedAt:    invitee.InvitedAt.UnixMilli(),
		})
	}

	// sort by invited_at (ascend)
	sort.Slice(resp, func(i, j int) bool {
		return resp[i].InvitedAt < resp[j].InvitedAt
	})

	c.JSON(http.StatusOK, resp)
}

// SessionInviteRequests 특정 유저가 받은 세션 초대 목록
func SessionInviteRequests(c *gin.Context) {
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	requests, err := database_io.GetWaitingSessionInvitedSessions(uid)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	resp := make(sessionInviteRequestsResponseDto, 0)
	for _, request := range requests {
		resp = append(resp, sessionInviteRequestsResponseItem{
			SessionId:    request.SessionId,
			SessionCode:  request.SessionCode,
			SessionName:  *request.Name,
			ThumbnailUrl: *request.ThumbnailUrl,
			InvitedAt:    request.InvitedAt.UnixMilli(),
		})
	}

	// sort by invited at (ascend)
	sort.Slice(resp, func(i, j int) bool {
		return resp[i].InvitedAt < resp[j].InvitedAt
	})

	c.JSON(http.StatusOK, resp)
}

func ConfirmSessionInvite(c *gin.Context) {
	uid := c.GetString("uid")
	var body sessionInviteConfirmRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	yes, err := platform.IsInvitedToSession(uid, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: you are not invited to this session")
		return
	}

	tx, err := database.DB.BeginTx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete invitation
	if err := database_io.DeleteSessionInvitationTx(tx, database.SessionInvitationEntity{
		SessionId: body.SessionId,
		UserId:    uid,
	}); err != nil {
		log.Error(err)
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if body.Accept {
		// add user to session
		if err := database_io.InsertUserToSessionTx(tx, database.UserSessionEntity{
			SessionId: body.SessionId,
			UserId:    uid,
			JoinedAt:  time.Now(),
		}); err != nil {
			log.Error(err)
			_ = tx.Rollback()
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.Status(http.StatusOK)
}

func JoinSession(c *gin.Context) {
	uid := c.GetString("uid")
	var body sessionJoinRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	sessionEntity, err := database_io.GetSessionByCode(body.SessionCode)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid session code")
		return
	}

	yes, err := platform.IsSessionMember(uid, sessionEntity.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: you are already member of this session")
		return
	}

	// is already requested joining
	alreadyRequested, err := platform.IsWaitingForSessionJoinRequestConfirm(uid, sessionEntity.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if alreadyRequested {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: you already requested joining this session")
		return
	}

	// is already invited on waiting list
	alreadyInvited, err := platform.IsWaitingForSessionInvitation(uid, sessionEntity.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	tx, err := database.DB.BeginTx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if alreadyInvited {
		// delete invitation
		if err := database_io.DeleteSessionInvitationTx(tx, database.SessionInvitationEntity{
			SessionId: sessionEntity.SessionId,
			UserId:    uid,
		}); err != nil {
			log.Error(err)
			_ = tx.Rollback()
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		// add user to session
		if err := database_io.InsertUserToSessionTx(tx, database.UserSessionEntity{
			SessionId: sessionEntity.SessionId,
			UserId:    uid,
		}); err != nil {
			log.Error(err)
			_ = tx.Rollback()
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	} else {
		if err := database_io.InsertSessionJoinRequestTx(tx, database.SessionJoinRequestEntity{
			SessionId:   sessionEntity.SessionId,
			UserId:      uid,
			RequestedAt: time.Now(),
		}); err != nil {
			log.Error(err)
			_ = tx.Rollback()
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.Status(http.StatusOK)
}

// SessionJoinRequests 특정 세션이 받은 참여 요청 유저 목록 반환
func SessionJoinRequests(c *gin.Context) {
	uid := c.GetString("uid")
	var query sessionJoinRequestsRequestDto
	if err := c.ShouldBindJSON(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	// check if user has permission to see waiting list
	yes, err := platform.IsSessionMember(uid, query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusForbidden, "permission denied: you are not member of this session")
		return
	}

	joinRequests, err := database_io.GetWaitingSessionJoinRequestedUsers(query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	resp := make(sessionJoinRequestsResponseDto, 0)
	for _, joinRequest := range joinRequests {
		resp = append(resp, sessionJoinRequestsResponseItem{
			UserId:       joinRequest.UserId,
			Username:     *joinRequest.Username,
			ProfileImage: *joinRequest.ProfileImage,
			RequestedAt:  joinRequest.RequestedAt.UnixMilli(),
		})
	}

	// sort by requested_at (ascend)
	sort.Slice(resp, func(i, j int) bool {
		return resp[i].RequestedAt < resp[j].RequestedAt
	})

	c.JSON(http.StatusOK, resp)
}

// SessionJoinWaitings 특정 유저가 참여 승인 대기 중인 세션 목록 반환
func SessionJoinWaitings(c *gin.Context) {
	uid := c.GetString("uid")
	joinWaitings, err := database_io.GetWaitingSessionJoinRequestedSessions(uid)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	resp := make(sessionJoinWaitingsResponseDto, 0)
	for _, joinWaiting := range joinWaitings {
		resp = append(resp, sessionJoinWaitingsResponseItem{
			SessionId:    joinWaiting.SessionId,
			SessionCode:  joinWaiting.SessionCode,
			SessionName:  *joinWaiting.Name,
			ThumbnailUrl: *joinWaiting.ThumbnailUrl,
			RequestedAt:  joinWaiting.RequestedAt.UnixMilli(),
		})
	}

	// sort by requested_at (ascend)
	sort.Slice(resp, func(i, j int) bool {
		return resp[i].RequestedAt < resp[j].RequestedAt
	})

	c.JSON(http.StatusOK, resp)
}

// ConfirmSessionJoin 특정 유저가 보낸 참여 요청 승인
func ConfirmSessionJoin(c *gin.Context) {
	uid := c.GetString("uid")
	var body sessionJoinConfirmRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// check if user has permission to confirm
	yes, err := platform.IsSessionCreator(uid, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusForbidden, "permission denied: you are not owner of this session")
		return
	}

	// check if user is waiting for confirmation
	yes, err = platform.IsWaitingForSessionJoinRequestConfirm(body.UserId, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: target user is not waiting for confirmation")
		return
	}

	tx, err := database.DB.BeginTx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete request
	if err := database_io.DeleteSessionJoinRequestTx(tx, database.SessionJoinRequestEntity{
		SessionId: body.SessionId,
		UserId:    body.UserId,
	}); err != nil {
		log.Error(err)
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if body.Accept {
		// add user to session
		if err := database_io.InsertUserToSessionTx(tx, database.UserSessionEntity{
			SessionId: body.SessionId,
			UserId:    body.UserId,
			JoinedAt:  time.Now(),
		}); err != nil {
			log.Error(err)
			_ = tx.Rollback()
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.Status(http.StatusOK)
}

// ExpelSession 특정 유저를 세션에서 추방
func ExpelSession(c *gin.Context) {
	uid := c.GetString("uid")
	var body sessionExpelRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// check if user has permission to expel
	yes, err := platform.IsSessionCreator(uid, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusForbidden, "permission denied: you are not owner of this session")
		return
	}

	// check if user is member of session
	yes, err = platform.IsSessionMember(body.UserId, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: target user is not member of this session")
		return
	}

	tx, err := database.DB.BeginTx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete user from session
	if err := database_io.DeleteUserFromSessionTx(tx, database.UserSessionEntity{
		SessionId: body.SessionId,
		UserId:    body.UserId,
	}); err != nil {
		log.Error(err)
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.Status(http.StatusOK)
}

// LeaveSession 특정 유저가 세션에서 나가기
func LeaveSession(c *gin.Context) {
	uid := c.GetString("uid")
	var body sessionLeaveRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// check if user is member of session
	yes, err := platform.IsSessionMember(uid, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: you are not member of this session")
		return
	}

	tx, err := database.DB.BeginTx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete user from session
	if err := database_io.DeleteUserFromSessionTx(tx, database.UserSessionEntity{
		SessionId: body.SessionId,
		UserId:    uid,
	}); err != nil {
		log.Error(err)
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.Status(http.StatusOK)
}

func UseSessionRouter(g *gin.RouterGroup) {
	rg := g.Group("/session")
	rg.GET("", Sessions)
	rg.PUT("", CreateSession)
	rg.DELETE("", DeleteSession)
	rg.GET("/currencies", Currencies)

	rg.POST("/invite", InviteSession)
	rg.GET("/invite-waitings", SessionInviteWaitings) // session waits
	rg.GET("/invite-requests", SessionInviteRequests) // user waits
	rg.POST("/invite-confirm", ConfirmSessionInvite)

	rg.POST("/join", JoinSession)
	rg.GET("/join-requests", SessionJoinRequests) // session waits
	rg.GET("/join-waitings", SessionJoinWaitings) // user waits
	rg.POST("/join-confirm", ConfirmSessionJoin)

	rg.POST("/expel", ExpelSession)
	rg.POST("/leave", LeaveSession)
}
