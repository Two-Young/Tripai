package platform

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"
	"travel-ai/controllers/socket"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"
	"travel-ai/service/platform/database_io"
	"travel-ai/third_party/pexels"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func Sessions(c *gin.Context) {
	uid := c.GetString("uid")
	sessions := make([]database.SessionEntity, 0)
	if err := database.DB.Select(&sessions, "SELECT sessions.* "+
		"FROM sessions "+
		"LEFT JOIN user_sessions us ON sessions.sid = us.sid "+
		"WHERE us.uid = ?;", uid); err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
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
			CreatorUserId: s.CreatorUserId,
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
	uid := c.GetString("uid")

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
		CreatorUserId: uid,
		Name:          &sessionName,
		StartAt:       &startAt,
		EndAt:         &endAt,
		CreatedAt:     time.Now(),
		ThumbnailUrl:  &imageUrl,
	}); err != nil {
		log.Error(err)
		log.Debug("debug")
		log.Debug(database.SessionEntity{
			SessionId:     sessionId,
			SessionCode:   platform.GenerateTenLengthCode(),
			CreatorUserId: uid,
			Name:          &sessionName,
			StartAt:       &startAt,
			EndAt:         &endAt,
			CreatedAt:     time.Now(),
			ThumbnailUrl:  &imageUrl,
		})
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
	uid := c.GetString("uid")

	var body sessionDeleteRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	tx, err := database.DB.BeginTx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// check if user has permission to delete session
	yes, err := platform.IsSessionCreator(uid, body.SessionId)
	if err != nil {
		log.Error(err)
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	// delete session
	if err = database_io.DeleteSessionTx(tx, body.SessionId); err != nil {
		log.Error(err)
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// commit
	if err = tx.Commit(); err != nil {
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

	sessionCurrencies, err := platform.GetSupportedSessionCurrenciesByCountry(query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	supportedCurrencies := make(map[string][]sessionSupportedCurrenciesResponseItem)
	for cca2, currencies := range sessionCurrencies {
		currencyList := make([]sessionSupportedCurrenciesResponseItem, 0)
		for _, currency := range currencies {
			currencyList = append(currencyList, sessionSupportedCurrenciesResponseItem{
				CurrencyCode:   currency.Code,
				CurrencyName:   currency.Name,
				CurrencySymbol: currency.Symbol,
			})
		}
		supportedCurrencies[cca2] = currencyList
	}
	c.JSON(http.StatusOK, supportedCurrencies)
}

func SessionMembers(c *gin.Context) {
	uid := c.GetString("uid")

	var query sessionMembersRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	// check if user has permission to see members
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

	members, err := database_io.GetSessionMembers(query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	resp := make(sessionMembersResponseDto, 0)
	for _, member := range members {
		resp = append(resp, sessionMembersResponseItem{
			UserId:       member.UserId,
			Username:     member.Username,
			ProfileImage: *member.ProfileImage,
			JoinedAt:     member.JoinedAt.UnixMilli(),
		})
	}

	c.JSON(http.StatusOK, resp)
}

func InviteSession(c *gin.Context) {
	uid := c.GetString("uid")

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

	if uid == body.TargetUserId {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: you cannot invite yourself")
		return
	}

	if uid != sessionEntity.CreatorUserId {
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

func CancelSessionInvite(c *gin.Context) {
	uid := c.GetString("uid")

	var body sessionInviteCancelRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// check if user has permission to cancel invitation
	var creatorUid string
	if err := database.DB.Get(
		&creatorUid,
		"SELECT creator_uid FROM sessions WHERE sid = ?",
		body.SessionId,
	); err != nil {
		if err == sql.ErrNoRows {
			util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid session id")
			return
		}
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if uid != creatorUid {
		util2.AbortWithStrJson(c, http.StatusForbidden, "permission denied: you are not owner of this session")
		return
	}

	// check if user is invited
	yes, err := platform.IsWaitingForSessionInvitation(body.TargetUserId, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: target user is not invited to this session")
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
		UserId:    body.TargetUserId,
	}); err != nil {
		log.Error(err)
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// commit
	if err := tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.Status(http.StatusOK)
}

// SessionInviteWaitings 특정 세션이 대기 중인 유저 초대 목록
func SessionInviteWaitings(c *gin.Context) {
	uid := c.GetString("uid")

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
			Username:     invitee.Username,
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
	uid := c.GetString("uid")

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

	if *body.Accept {
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

	// join user to session chatroom if possible
	if *body.Accept {
		go func() {
			userEntity, err := database_io.GetUser(uid)
			if err != nil {
				log.Error(err)
				return
			}

			sock, ok := socket.SocketManager.GetUserByUserId(userEntity.UserId)
			if ok {
				socket.SocketManager.Io.JoinRoom("/", socket.RoomKey(body.SessionId), sock.Conn)
				socket.SocketManager.Io.BroadcastToRoom("/", socket.RoomKey(body.SessionId),
					"sessionChat/userJoined", socket.NewChatMessage(
						"", "", nil,
						fmt.Sprintf("%s joined the session", userEntity.Username),
						time.Now().UnixMilli(), socket.TypeSystemMessage),
				)
			}
		}()
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

func CancelSessionJoin(c *gin.Context) {
	uid := c.GetString("uid")
	var body sessionJoinCancelRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// check if user has permission to cancel request
	yes, err := platform.IsWaitingForSessionJoinRequestConfirm(uid, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: you are not waiting for confirmation")
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
		SessionId:   body.SessionId,
		UserId:      uid,
		RequestedAt: time.Now(),
	}); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// commit
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
			Username:     joinRequest.Username,
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

	if *body.Accept {
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

	// join user to session chatroom if possible
	if *body.Accept {
		go func() {
			userEntity, err := database_io.GetUser(body.UserId)
			if err != nil {
				log.Error(err)
				return
			}

			sock, ok := socket.SocketManager.GetUserByUserId(userEntity.UserId)
			if ok {
				socket.SocketManager.Io.JoinRoom("/", socket.RoomKey(body.SessionId), sock.Conn)
				socket.SocketManager.Io.BroadcastToRoom("/", socket.RoomKey(body.SessionId),
					"sessionChat/userJoined", socket.NewChatMessage(
						"", "", nil,
						fmt.Sprintf("%s joined the session", userEntity.Username),
						time.Now().UnixMilli(), socket.TypeSystemMessage),
				)
			}
		}()
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

	// get session members
	members, err := database_io.GetSessionMembers(body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// check if user is owner of session
	yes, err = platform.IsSessionCreator(uid, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "permission denied: you are owner of this session, so you must transfer ownership before leave")
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

	// TODO :: delete session if no member
	if len(members) == 1 {
		// delete session
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
	rg.GET("/members", SessionMembers)

	rg.POST("/invite", InviteSession)
	rg.POST("/invite-cancel", CancelSessionInvite)
	rg.GET("/invite-waitings", SessionInviteWaitings) // session waits
	rg.GET("/invite-requests", SessionInviteRequests) // user waits
	rg.POST("/invite-confirm", ConfirmSessionInvite)

	rg.POST("/join", JoinSession)
	rg.POST("/join-cancel", CancelSessionJoin)
	rg.GET("/join-requests", SessionJoinRequests) // session waits
	rg.GET("/join-waitings", SessionJoinWaitings) // user waits
	rg.POST("/join-confirm", ConfirmSessionJoin)

	rg.POST("/expel", ExpelSession)
	rg.POST("/leave", LeaveSession)
}
