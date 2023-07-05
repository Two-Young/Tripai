package controller

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"net/http"
	"travel-ai/log"
	"travel-ai/service/database"
)

func RefreshToken(c *gin.Context) {
	// get refresh token from header
	refreshToken := c.GetHeader("X-Refresh-Token")
	if refreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh token not found"})
		return
	}

	userId, err := database.InMemoryDB.Get(refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// check if user exists
	var userEntity database.UserEntity
	if err := database.DB.QueryRowx("SELECT * FROM users WHERE uid = ?", userId).StructScan(&userEntity); err != nil {
		if err == sql.ErrNoRows {
			// user not found
			log.Error("user not found")
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		log.Error(err)
		c.AbortWithStatus(http.StatusForbidden)
		return
	}

	authToken, err := createAuthToken(userId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err := saveRefreshToken(userId, authToken.RefreshToken); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusOK, authToken)
}

func UseAuthRouter(r *gin.Engine) {
	g := r.Group("/auth")
	UseGoogleAuthRouter(g)
	UseNaverAuthRouter(g)

	g.POST("/refreshToken", RefreshToken)
}
