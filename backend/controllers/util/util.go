package util

import (
	"errors"
	"fmt"
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

func AbortWithStrJsonF(c *gin.Context, code int, format string, args ...interface{}) {
	c.AbortWithStatusJSON(code, SFJ(format, args...))
}

func EJ(e error) gin.H {
	return gin.H{"error": e.Error()}
}

func SJ(str string) gin.H {
	return gin.H{"error": str}
}

func SFJ(format string, args ...interface{}) gin.H {
	str := fmt.Sprintf(format, args...)
	return gin.H{"error": str}
}
