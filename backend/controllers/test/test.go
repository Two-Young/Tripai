package test

import (
	"github.com/gin-gonic/gin"
	"travel-ai/controllers/auth"
	"travel-ai/controllers/util"
	"travel-ai/service/platform/database_io"
)

func ErrResponse(c *gin.Context) {
	util.AbortWithStrJson(c, 500, "Test Error")
}

func GetPlaceDetailCacheTest(c *gin.Context) {
	placeId := c.Query("place_id")
	obj, err := database_io.GetPlaceDetailCache(c, placeId)
	if err != nil {
		util.AbortWithErrJson(c, 500, err)
		return
	}
	c.JSON(200, obj)
}

func GetDevAccessToken(c *gin.Context) {
	authTokenBundle, err := auth.CreateAuthToken("dev")
	if err != nil {
		util.AbortWithErrJson(c, 500, err)
		return
	}

	c.JSON(200, authTokenBundle.AccessToken)
}

func UseTestTestRouter(g *gin.RouterGroup) {
	sg := g.Group("/test")
	sg.POST("/err-response", ErrResponse)
	sg.GET("/get-place-detail-cache", GetPlaceDetailCacheTest)
	sg.GET("/get-dev-access-token", GetDevAccessToken)
}
