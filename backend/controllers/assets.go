package controllers

import (
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/util"
)

type getUserProfileImageRequestDto struct {
	UserId string `form:"user_id" binding:"required"`
}

func GetUserProfileImage(c *gin.Context) {
	var query getUserProfileImageRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	filePath := filepath.Join(util.GetRootDirectory(), "files", "users", query.UserId, "profile_image")
	f, err := os.Open(filePath)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, errors.New("failed to read image"))
		return
	}
	defer f.Close()

	fileInfo, _ := f.Stat()
	fileSize := fileInfo.Size()

	c.Header("Content-Disposition", "attachment; filename=profile_image")
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Length", strconv.FormatInt(fileSize, 10))
	c.File(filePath)
}

func UseAssetRouter(r *gin.Engine) {
	g := r.Group("/asset")
	g.GET("/profile-image", GetUserProfileImage)
}
