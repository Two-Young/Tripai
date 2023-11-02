package auth

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"net/http"
	"travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
)

func RefreshToken(c *gin.Context) {
	// get refresh token from header
	refreshToken := c.GetHeader("X-Refresh-Token")
	if refreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh token isn't present in request header"})
		for k, v := range c.Request.Header {
			log.Debug(k, v)
		}
		return
	}

	userId, err := database.InMemoryDB.Get(refreshToken)
	if err != nil {
		util.AbortWithErrJson(c, http.StatusUnauthorized, err)
		return
	}

	// check if user exists
	var userEntity database.UserEntity
	if err := database.DB.QueryRowx("SELECT * FROM users WHERE uid = ?", userId).StructScan(&userEntity); err != nil {
		if err == sql.ErrNoRows {
			// user not found
			log.Error("user not found")
			util.AbortWithStrJson(c, http.StatusUnauthorized, "user not found")
			return
		}
		log.Error(err)
		util.AbortWithErrJson(c, http.StatusUnauthorized, err)
		return
	}

	authToken, err := CreateAuthToken(userId)
	if err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusInternalServerError, "failed to create auth token")
		return
	}

	if err := saveRefreshToken(userId, authToken.RefreshToken); err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusInternalServerError, "failed to save refresh token")
		return
	}

	c.JSON(http.StatusOK, authToken)
}

func UseAuthRouter(r *gin.Engine) {
	g := r.Group("/auth")
	UseGoogleAuthRouter(g)
	UseNaverAuthRouter(g)
	UseFacebookAuthRouter(g)
	UseKakaoAuthRouter(g)
	UseUserAuthRouter(g)

	g.POST("/refreshToken", RefreshToken)
}
