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
	"travel-ai/third_party/taggun_receipt_ocr"
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
	processedImage, err := opencv.CropReceiptSubImage(image)
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

	taggunResp, err := taggun_receipt_ocr.ParseReceipt(f)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	totalAmount := 0.0
	totalAmountUnit := "" // KRW, USD, JPY, ...
	totalAmountConfident := false
	if taggunResp.TotalAmount.ConfidenceLevel >= 0.5 {
		totalAmount = taggunResp.TotalAmount.Data
		totalAmountUnit = taggunResp.TotalAmount.CurrencyCode
		totalAmountConfident = true
	} else {
		log.Debugf("total amount confidence level is too low: %v", taggunResp.TotalAmount.ConfidenceLevel)
	}

	taxAmount := 0.0
	taxAmountUnit := "" // KRW, USD, JPY, ...
	taxAmountConfident := false
	if taggunResp.TaxAmount.ConfidenceLevel >= 0.5 {
		taxAmount = taggunResp.TaxAmount.Data
		taxAmountUnit = taggunResp.TaxAmount.CurrencyCode
		taxAmountConfident = true
	} else {
		log.Debugf("tax amount confidence level is too low: %v", taggunResp.TaxAmount.ConfidenceLevel)
	}

	type Item struct {
		Name   string
		Amount int
		Price  float64
	}
	items := make(map[int]Item)
	for _, amountRaw := range taggunResp.Amounts {
		itemRaw, ok := items[amountRaw.Index]
		if !ok {
			itemRaw = Item{
				Amount: 1,
			}
		}
		itemRaw.Name = amountRaw.Text
		itemRaw.Price = amountRaw.Data
		items[amountRaw.Index] = itemRaw
	}
	for _, numberRaw := range taggunResp.Numbers {
		itemRaw, ok := items[numberRaw.Index]
		if !ok {
			itemRaw = Item{}
		}
		itemRaw.Amount = numberRaw.Data
		items[numberRaw.Index] = itemRaw
	}

	if !totalAmountConfident {
		totalAmount = 0.0
		for _, item := range items {
			totalAmount += item.Price
		}
	}

	if !taxAmountConfident {
		taxAmount = 0.0
	}

	log.Debugf("total amount: %v", totalAmount)
	log.Debugf("total amount unit: %v", totalAmountUnit)
	log.Debugf("tax amount: %v", taxAmount)
	log.Debugf("tax amount unit: %v", taxAmountUnit)

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
