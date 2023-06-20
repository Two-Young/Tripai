package auth

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"path/filepath"
	"time"
	"travel-ai/log"
	"travel-ai/third_party/google_cloud/cloud_vision"
	"travel-ai/util"
)

func Image2Text(c *gin.Context) {
	file, _ := c.FormFile("file")

	// save file as temp file
	curTimeSeq := time.Now().Format("202306251715")
	newFileName := curTimeSeq + "-" + file.Filename
	rootDir := util.GetRootDirectory()
	dest := filepath.Join(rootDir, "/temp/", newFileName)
	if err := c.SaveUploadedFile(file, dest); err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}
	log.Debug("file saved as: " + dest)

	defer func() {
		// delete temp file
		if err := os.Remove(dest); err != nil {
			log.Error(err)
			return
		}
	}()

	// request api
	_, err := cloud_vision.RequestImageToText(dest)
	if err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func UseCloudVisionRouter(g *gin.RouterGroup) {
	sg := g.Group("/cloud-vision")
	sg.POST("/image2text", Image2Text)
}
