package middlewares

import (
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
	"travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/platform"
)

func AuthMiddleware(c *gin.Context) {
	rawToken, err := platform.ExtractAuthToken(c.Request)
	if err != nil {
		log.Warn(err)
		util.AbortWithErrJson(c, http.StatusUnauthorized, err)
		return
	}

	userId, errorMap := platform.DissolveAuthToken(rawToken)
	if errorMap != nil {
		log.Warn(errorMap)
		util.AbortWithErrJson(c, http.StatusUnauthorized, errors.New("all auth-dissolve methods failed"))
		return
	}

	c.Set("uid", userId)
	c.Next()
}
