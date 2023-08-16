package platform

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"image"
	"net/http"
	"os"
	"path/filepath"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/third_party/google_cloud/cloud_vision"
	"travel-ai/util"
)

func UploadReceipt(c *gin.Context) {
	var query receiptUploadRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	// TODO :: check permission to upload this session

	file, _ := c.FormFile("file")
	log.Debugf("Receipt file uploaded: %s", file.Filename)

	receiptId := uuid.New().String()

	// save file as temp file
	filename := receiptId
	rootDir := util.GetRootDirectory()
	dest := filepath.Join(rootDir, query.SessionId, filename)
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

	items := make([]receiptTextItem, 0)
	for _, a := range annotations {
		vertices := a.BoundingPoly.Vertices
		if len(vertices) == 0 {
			continue
		}
		items = append(items, receiptTextItem{
			Text: a.Description,
			Boundary: receiptTextItemBoundary{
				Top:    int(vertices[0].Y),
				Left:   int(vertices[0].X),
				Width:  int(vertices[2].X - vertices[0].X),
				Height: int(vertices[2].Y - vertices[0].Y),
			},
		})
	}

	// create receipt entity
	// TODO :: discuss about unit & type
	if _, err := database.DB.Exec(
		"INSERT INTO receipts(rid, name, filename, sid, total_price, unit, type) VALUES (?, ?, ?, ?, ?, ?, ?);",
		receiptId, filename, filename, query.SessionId, 0, "", ""); err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	resp := receiptUploadResponseDto{
		Items: items,
		Resolution: receiptImageResolution{
			Width:  img.Width,
			Height: img.Height,
		},
		ReceiptId: receiptId,
	}

	c.JSON(http.StatusOK, resp)
}

func SubmitReceipt(c *gin.Context) {
	var body receiptSubmitRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}

	// TODO :: check permission to submit to this session

}

func UseReceiptRouter(g *gin.RouterGroup) {
	rg := g.Group("/receipt")
	rg.POST("/upload", UploadReceipt)
	rg.POST("/submit", SubmitReceipt)
}
