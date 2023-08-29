package platform

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"image"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"
	"travel-ai/service/platform/database_io"
	"travel-ai/third_party/google_cloud/cloud_vision"
	"travel-ai/util"
)

func GetReceipts(c *gin.Context) {
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	var query receiptGetRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	// check permission to view this sessions
	permOk, err := platform.CheckPermissionBySessionId(uid, query.SessionId)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	if !permOk {
		util2.AbortWithStrJson(c, http.StatusForbidden, "permission denied")
		return
	}

	receiptEntities, err := database_io.GetReceipts(query.SessionId)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	receipts := make(receiptGetResponseDto, 0)
	for _, receipt := range receiptEntities {
		receipts = append(receipts, receiptGetResponseItem{
			ReceiptId: receipt.ReceiptId,
			Name:      receipt.Name,
		})
	}

	c.JSON(http.StatusOK, receipts)
}

func GetReceiptImage(c *gin.Context) {
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	var query receiptGetImageRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	if query.ReceiptId == "" {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "receipt id not provided")
		return
	}

	// check permission to view this session receipt
	permOk, err := platform.CheckPermissionByReceiptId(uid, query.ReceiptId)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	if !permOk {
		util2.AbortWithStrJson(c, http.StatusForbidden, "permission denied")
		return
	}

	receipt, err := database_io.GetReceipt(query.ReceiptId)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	filePath := filepath.Join(util.GetRootDirectory(), "files", "receipts", receipt.SessionId, receipt.Filename)
	f, err := os.Open(filePath)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, errors.New("failed to read image"))
		return
	}
	defer f.Close()

	fileInfo, _ := f.Stat()
	fileSize := fileInfo.Size()

	c.Header("Content-Disposition", "attachment; filename="+receipt.Filename)
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Length", strconv.FormatInt(fileSize, 10))
	c.File(filePath)
}

func GetCurrentReceipt(c *gin.Context) {
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	var query receiptGetCurrentRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	if query.ReceiptId == "" {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "receipt id not provided")
		return
	}

	receipt, err := database_io.GetReceipt(query.ReceiptId)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	// check permission to view this session receipt
	permOk, err := platform.CheckPermissionByReceiptId(uid, query.ReceiptId)
	if !permOk {
		if err != nil {
			log.Error(err)
		}
		util2.AbortWithStrJson(c, http.StatusForbidden, "permission denied")
		return
	}

	receiptItems := make([]receiptTextItem, 0)
	receiptItemEntities, err := database_io.GetReceiptItems(query.ReceiptId)
	for _, item := range receiptItemEntities {
		receiptItems = append(receiptItems, receiptTextItem{
			ReceiptItemId: item.ReceiptItemId,
			Label: receiptLabelItem{
				ReceiptIemBoxId: item.LabelBoxId,
				Text:            item.Label,
			},
			Price: receiptPriceItem{
				ReceiptIemBoxId: item.PriceBoxId,
				Value:           item.Price,
			},
		})
	}

	receiptIemBoxes := make([]receiptItemBox, 0)
	receiptItemBoxEntities, err := database_io.GetReceiptItemBoxes(query.ReceiptId)
	for _, box := range receiptItemBoxEntities {
		receiptIemBoxes = append(receiptIemBoxes, receiptItemBox{
			ReceiptItemBoxId: box.ReceiptItemBoxId,
			Text:             box.Text,
			Boundary: receiptTextItemBoundary{
				Top:    box.Top,
				Left:   box.Left,
				Width:  box.Width,
				Height: box.Height,
			},
		})
	}

	resp := &receiptGetCurrentResponseDto{
		ItemBoxes: receiptIemBoxes,
		Items:     receiptItems,
		Resolution: receiptImageResolution{
			Width:  receipt.Width,
			Height: receipt.Height,
		},
	}

	c.JSON(http.StatusOK, resp)
}

func UploadReceipt(c *gin.Context) {
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	var query receiptUploadRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	permOk, err := platform.CheckPermissionBySessionId(uid, query.SessionId)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	if !permOk {
		util2.AbortWithStrJson(c, http.StatusForbidden, "permission denied")
		return
	}

	file, _ := c.FormFile("file")
	if file == nil {
		log.Error("file not found")
		util2.AbortWithStrJson(c, http.StatusBadRequest, "no file uploaded")
		return
	}

	log.Debugf("Receipt file uploaded: %s", file.Filename)
	receiptId := uuid.New().String()

	// save file as temp file
	savedFileName := receiptId
	rootDir := util.GetRootDirectory()
	dest := filepath.Join(rootDir, "files", "receipts", query.SessionId, savedFileName)
	if err := c.SaveUploadedFile(file, dest); err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	log.Debug("file saved as: " + dest)

	f, err := os.Open(dest)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, errors.New("failed to read image"))
		return
	}

	img, _, err := image.DecodeConfig(f)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, errors.New("failed to decode image"))
		return
	}

	// request api
	annotations, err := cloud_vision.RequestImageToText(dest)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	tx, err := database.DB.BeginTxx(c, nil)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	// create receipt entity
	// TODO :: discuss about unit & type
	if err := database_io.InsertReceiptTx(tx, database.ReceiptEntity{
		ReceiptId:        receiptId,
		Name:             file.Filename,
		OriginalFilename: file.Filename,
		Filename:         savedFileName,
		SessionId:        query.SessionId,
		TotalPrice:       0,
		Unit:             "",
		Type:             "",
		Width:            img.Width,
		Height:           img.Height,
	}); err != nil {
		_ = tx.Rollback()
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	// insert receipt items
	for _, a := range annotations {
		vertices := a.BoundingPoly.Vertices
		trimmedText := strings.TrimSpace(a.Description)
		if len(vertices) == 0 || trimmedText == "" {
			continue
		}
		if len(trimmedText) > 50 {
			log.Debug("Text too long: ", trimmedText)
			continue
		}
		//log.Debug("Text: ", trimmedText)
		receiptItemBox := database.ReceiptItemBoxEntity{
			ReceiptItemBoxId: uuid.New().String(),
			ReceiptId:        receiptId,
			Text:             trimmedText,
			Top:              int(vertices[0].Y),
			Left:             int(vertices[0].X),
			Width:            int(vertices[2].X - vertices[0].X),
			Height:           int(vertices[2].Y - vertices[0].Y),
		}
		if err := database_io.InsertReceiptItemBoxTx(tx, receiptItemBox); err != nil {
			_ = tx.Rollback()
			log.Error(err)
			util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, receiptId)
}

func SubmitReceipt(c *gin.Context) {
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	var body receiptSubmitRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// check permission
	permOk, err := platform.CheckPermissionByReceiptId(uid, body.ReceiptId)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}
	if !permOk {
		util2.AbortWithStrJson(c, http.StatusForbidden, "permission denied")
		return
	}

	// create receipt item entities
	tx, err := database.DB.BeginTxx(c, nil)
	if err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	for _, item := range body.Items {
		price, err := platform.ExtractNumberFromString(item.Price.Text)
		if err != nil {
			_ = tx.Rollback()
			log.Error(err)
			util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
			return
		}

		if err := database_io.InsertReceiptItemTx(tx, database.ReceiptItemEntity{
			ReceiptItemId: uuid.New().String(),
			Label:         item.Label.Text,
			LabelBoxId:    item.Label.BoxId,
			Price:         price,
			PriceBoxId:    item.Price.BoxId,
			ReceiptId:     body.ReceiptId,
		}); err != nil {
			_ = tx.Rollback()
			log.Error(err)
			util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	c.Status(http.StatusOK)
}

func UseReceiptRouter(g *gin.RouterGroup) {
	rg := g.Group("/receipt")
	rg.GET("", GetReceipts)
	rg.GET("/current", GetCurrentReceipt)
	rg.GET("/image", GetReceiptImage)
	rg.POST("/upload", UploadReceipt)
	rg.POST("/submit", SubmitReceipt)
}
