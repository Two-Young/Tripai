package test

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/third_party/google_cloud/cloud_vision"
	"travel-ai/third_party/opencv"
	"travel-ai/util"

	"github.com/gin-gonic/gin"
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
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
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
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{})
}

func ImagePreprocess(c *gin.Context) {
	file, _ := c.FormFile("file")
	if file == nil {
		log.Error("file not found")
		util2.AbortWithStrJson(c, http.StatusBadRequest, "no file uploaded")
		return
	}
	
	rawMinVal := c.PostForm("min_val")
	rawMaxVal := c.PostForm("max_val")
	rawThreshold := c.PostForm("threshold")
	
	// convert
	minVal, err := strconv.ParseFloat(rawMinVal, 32)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusBadRequest, err)
		return
	}
	
	maxVal, err := strconv.ParseFloat(rawMaxVal, 32)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusBadRequest, err)
		return
	}
	
	threshold, err := strconv.ParseFloat(rawThreshold, 32)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusBadRequest, err)
		return
	}
	
	// save file as temp file
	dest, _ := util.GenerateTempFilePath()
	if err := c.SaveUploadedFile(file, dest); err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	log.Debug("file saved as: " + dest)
	
	image, err := util.OpenFileAsImage(dest)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	
	//processedImage, err := cloud_vision.PreprocessImage(image)
	processedImage, err := opencv.CropReceiptSubImage(image, float32(minVal), float32(maxVal), float32(threshold))
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	
	// overwrite file
	if err := util.SaveImageFileAsPng(processedImage, dest, true); err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	
	f, err := os.Open(dest)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	defer func(f *os.File) {
		err := f.Close()
		if err != nil {
			log.Error(err)
			return
		}
	
		// delete temp file
		if err := os.Remove(dest); err != nil {
			log.Error(err)
			return
		}
		log.Debug("temp file deleted: " + dest)
	}(f)
	
	fileInfo, _ := f.Stat()
	fileSize := fileInfo.Size()
	
	c.Header("Content-Disposition", "attachment; filename=preprocessed.png")
	c.Header("Content-Type", "image/png")
	c.Header("Content-Length", strconv.FormatInt(fileSize, 10))
	c.File(dest)
}

func UseCloudVisionRouter(g *gin.RouterGroup) {
	sg := g.Group("/cloud-vision")
	sg.POST("/image2text", Image2Text)
	sg.POST("/image-preprocess", ImagePreprocess)
}
