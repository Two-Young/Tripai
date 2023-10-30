package test

import (
	"github.com/gin-gonic/gin"
	"travel-ai/controllers/auth"
	"travel-ai/controllers/socket"
	"travel-ai/controllers/util"
	"travel-ai/service/database"
	"travel-ai/service/platform/database_io"
)

func ErrResponse(c *gin.Context) {
	util.AbortWithStrJson(c, 500, "Test Error")
}

func DatabaseStatus(c *gin.Context) {
	c.JSON(200, database.DB.Stats())
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

func BindJsonTest(c *gin.Context) {
	type Test struct {
		A string `json:"a"`
		B int    `json:"b"`
		C struct {
			D string  `json:"d"`
			E *string `json:"e"`
			F *int    `json:"f"`
			G string  `json:"g" binding:"required"`
		} `json:"c"`
	}
	testStr := `{"a": "str1", "b": 149, "c": {"d": "str2", "e": "str3", "f": null}}`
	var test Test
	err := socket.BindJson(testStr, &test)
	if err != nil {
		util.AbortWithErrJson(c, 500, err)
		return
	}
	c.JSON(200, test)
}

func UseTestTestRouter(g *gin.RouterGroup) {
	sg := g.Group("/test")
	sg.POST("/err-response", ErrResponse)
	sg.GET("/database-status", DatabaseStatus)
	sg.GET("/get-place-detail-cache", GetPlaceDetailCacheTest)
	sg.GET("/get-dev-access-token", GetDevAccessToken)
	sg.POST("/bind-json", BindJsonTest)
}
