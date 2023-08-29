package util

import (
	"errors"
	"github.com/gin-gonic/gin"
)

func GetUid(c *gin.Context) (string, error) {
	rawUid, ok := c.Get("uid")
	if !ok {
		return "", errors.New("uid not found")
	}
	return rawUid.(string), nil
}

func AbortWithErrJson(c *gin.Context, code int, err error) {
	c.AbortWithStatusJSON(code, EJ(err))
}

func AbortWithStrJson(c *gin.Context, code int, str string) {
	c.AbortWithStatusJSON(code, SJ(str))
}

func EJ(e error) gin.H {
	return gin.H{
		"error": e.Error(),
	}
}

func SJ(str string) gin.H {
	return gin.H{
		"error": str,
	}
}
