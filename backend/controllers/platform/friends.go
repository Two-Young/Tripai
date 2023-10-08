package platform

import (
	"net/http"
	"time"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform/database_io"

	"github.com/gin-gonic/gin"
)

func GetFriends(c *gin.Context) {
	uid := c.GetString("uid")

	friendsEntity, err := database_io.GetFriendsRelationInfo(uid)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	friends := make(friendsGetResponseDto, 0)
	for _, f := range friendsEntity {
		if f.ConfirmedAt == nil {
			log.Error("confirmed_at is nil")
			continue
		}

		friends = append(friends, friendsGetResponseItem{
			UserId:       f.UserId,
			UserCode:     f.UserCode,
			Username:     f.Username,
			ProfileImage: f.ProfileImage,
			AcceptedAt:   f.ConfirmedAt.UnixMilli(),
		})
	}

	c.JSON(http.StatusOK, friends)
}

func RequestFriend(c *gin.Context) {
	uid := c.GetString("uid")

	var body friendsRequestRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	if uid == body.TargetUserId {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "cannot send request to self")
		return
	}

	relations, err := database_io.GetSingleFriendRelationInfo(uid, body.TargetUserId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	alreadyFriend := false
	alreadySentRequest := false
	opponentSentMe := false
	for _, r := range relations {
		if r.Accepted {
			alreadyFriend = true
			break
		} else if r.RequestedUserId == uid {
			alreadySentRequest = true
			break
		} else if r.RequestedUserId == body.TargetUserId {
			opponentSentMe = true
			break
		}
	}

	// check if the user is already a friend
	if alreadyFriend {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "already friend")
		return
	}

	// check if the user already sent a request
	if alreadySentRequest {
		util2.AbortWithStrJson(c, http.StatusConflict, "already sent request")
		return
	}

	tx, err := database.DB.BeginTxx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// check if the opponent sent a request
	if opponentSentMe {
		// if so, accept the request
		now := time.Now()
		if err := database_io.UpdateFriendRelationTx(tx, database.FriendEntity{
			UserId:          uid,
			RequestedUserId: body.TargetUserId,
			Accepted:        true,
			RequestedAt:     time.Now(),
			ConfirmedAt:     &now,
		}); err != nil {
			log.Error(err)
			_ = tx.Rollback()
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	} else {
		// create a new request
		if err := database_io.InsertFriendRelationTx(tx, database.FriendEntity{
			UserId:          body.TargetUserId,
			RequestedUserId: uid,
			Accepted:        false,
			RequestedAt:     time.Now(),
			ConfirmedAt:     nil,
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

	c.JSON(http.StatusOK, nil)
}

func CancelFriendRequest(c *gin.Context) {
	uid := c.GetString("uid")

	var body friendsRequestCancelRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	relations, err := database_io.GetSingleFriendRelationInfo(uid, body.TargetUserId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	alreadyFriend := false
	iSentToOpposite := false
	for _, r := range relations {
		if r.Accepted {
			alreadyFriend = true
			break
		} else if r.RequestedUserId == uid {
			iSentToOpposite = true
			break
		}
	}

	// check if the user is already a friend
	if alreadyFriend {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "already friend")
		return
	}

	// check if the I sent a request
	if !iSentToOpposite {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "no request from me: abnormal request")
		return
	}

	tx, err := database.DB.BeginTxx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete the request
	if err := database_io.DeleteFriendRelationTx(tx, body.TargetUserId, uid); err != nil {
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

	c.JSON(http.StatusOK, nil)
}

func AcceptFriend(c *gin.Context) {
	uid := c.GetString("uid")

	var body friendsAcceptRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	relations, err := database_io.GetSingleFriendRelationInfo(uid, body.RequestedUserId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	alreadyFriend := false
	opponentSentMe := false
	for _, r := range relations {
		if r.Accepted {
			alreadyFriend = true
			break
		} else if r.RequestedUserId == body.RequestedUserId {
			opponentSentMe = true
			break
		}
	}

	// check if the user is already a friend
	if alreadyFriend {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "already friend")
		return
	}

	// check if the user sent me a request
	if !opponentSentMe {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "no request from opponent: abnormal request")
		return
	}

	tx, err := database.DB.BeginTxx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete if I sent a request
	if err := database_io.DeleteFriendRelationTx(tx, body.RequestedUserId, uid); err != nil {
		log.Error(err)
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// accept the request
	now := time.Now()
	if err := database_io.UpdateFriendRelationTx(tx, database.FriendEntity{
		UserId:          uid,
		RequestedUserId: body.RequestedUserId,
		Accepted:        true,
		RequestedAt:     time.Now(),
		ConfirmedAt:     &now,
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

	c.JSON(http.StatusOK, nil)
}

func RejectFriend(c *gin.Context) {
	uid := c.GetString("uid")

	var body friendsRejectRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	relations, err := database_io.GetSingleFriendRelationInfo(uid, body.RequestedUserId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	alreadyFriend := false
	opponentSentMe := false
	for _, r := range relations {
		if r.Accepted {
			alreadyFriend = true
			break
		} else if r.RequestedUserId == body.RequestedUserId {
			opponentSentMe = true
			break
		}
	}

	// check if the user is already a friend
	if alreadyFriend {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "already friend")
		return
	}

	// check if the user sent me a request
	if !opponentSentMe {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "no request from opponent: abnormal request")
		return
	}

	tx, err := database.DB.BeginTxx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// reject the request
	if err := database_io.DeleteFriendRelationTx(tx, uid, body.RequestedUserId); err != nil {
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

	c.JSON(http.StatusOK, nil)
}

func GetWaitingFriendRequests(c *gin.Context) {
	uid := c.GetString("uid")

	sent, err := database_io.GetSentFriendsRequestWaitings(uid)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	received, err := database_io.GetReceivedFriendsRequestWaitings(uid)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	resp := friendsWaitingRequestsResponseDto{
		Sent:     make([]friendsWaitingRequests, 0),
		Received: make([]friendsWaitingRequests, 0),
	}

	for _, s := range sent {
		resp.Sent = append(resp.Sent, friendsWaitingRequests{
			UserId:       s.UserId,
			Username:     s.Username,
			ProfileImage: s.ProfileImage,
			RequestedAt:  s.RequestedAt.UnixMilli(),
		})
	}

	for _, r := range received {
		resp.Received = append(resp.Received, friendsWaitingRequests{
			UserId:       r.UserId,
			Username:     r.Username,
			ProfileImage: r.ProfileImage,
			RequestedAt:  r.RequestedAt.UnixMilli(),
		})
	}

	c.JSON(http.StatusOK, resp)
}

func SearchFriend(c *gin.Context) {
	var query friendsSearchRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	users, err := database_io.GetFriendByKeyword(query.Query)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	resp := make(friendsSearchResponseDto, 0)
	for _, u := range users {
		resp = append(resp, friendsSearchResponseItem{
			UserId:       u.UserId,
			UserCode:     u.UserCode,
			Username:     u.Username,
			ProfileImage: u.ProfileImage,
		})
	}

	c.JSON(http.StatusOK, resp)
}

func DeleteFriend(c *gin.Context) {
	uid := c.GetString("uid")

	var body friendsDeleteRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	relations, err := database_io.GetSingleFriendRelationInfo(uid, body.TargetUserId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	alreadyFriend := false
	for _, r := range relations {
		if r.Accepted {
			alreadyFriend = true
			break
		}
	}

	if !alreadyFriend {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "not a friend")
		return
	}

	tx, err := database.DB.BeginTxx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// delete the relation
	if err := database_io.DeleteFriendAcceptedRelationTx(tx, uid, body.TargetUserId); err != nil {
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

	c.JSON(http.StatusOK, nil)
}

func UseFriendsRouter(g *gin.RouterGroup) {
	rg := g.Group("/friends")
	rg.GET("", GetFriends)
	rg.POST("/request", RequestFriend)
	rg.POST("/cancel", CancelFriendRequest)
	rg.POST("/accept", AcceptFriend)
	rg.POST("/reject", RejectFriend)
	rg.GET("/waiting", GetWaitingFriendRequests)
	rg.POST("/search", SearchFriend)
	rg.DELETE("", DeleteFriend)
}
