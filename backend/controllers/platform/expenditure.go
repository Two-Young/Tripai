package platform

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"math/big"
	"net/http"
	"os"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"
	"travel-ai/service/platform/database_io"
	"travel-ai/third_party/opencv"
	"travel-ai/third_party/taggun_receipt_ocr"
	"travel-ai/util"
)

func Expenditures(c *gin.Context) {
	uid := c.GetString("uid")

	var query ExpendituresGetRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query: "+err.Error())
		return
	}

	// check if session exists
	_, err := database_io.GetSession(query.SessionId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "session does not exist")
		return
	}

	// check if user is in session
	yes, err := platform.IsSessionMember(uid, query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "user is not in session")
		return
	}

	expenditureEntities, err := database_io.GetExpendituresBySessionId(query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	expenditures := make(ExpendituresGetResponseDto, 0)
	for _, e := range expenditureEntities {
		expenditures = append(expenditures, ExpendituresGetResponseItem{
			ExpenditureId: e.ExpenditureId,
			Name:          e.Name,
			TotalPrice:    e.TotalPrice,
			CurrencyCode:  e.CurrencyCode,
			Category:      e.Category,
			PayedAt:       e.PayedAt,
			HasReceipt:    e.HasReceipt,
		})
	}

	c.JSON(http.StatusOK, expenditures)
}

func Expenditure(c *gin.Context) {
	uid := c.GetString("uid")

	var query ExpenditureGetRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query: "+err.Error())
		return
	}

	// check if expenditure exists
	expenditureEntity, err := database_io.GetExpenditure(query.ExpenditureId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "expenditure does not exist")
		return
	}

	// check if user is in session
	yes, err := platform.IsSessionMember(uid, expenditureEntity.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "user is not in session")
		return
	}

	// get payers
	payerEntities, err := database_io.GetExpenditurePayers(query.ExpenditureId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	payers := make([]string, 0)
	for _, payer := range payerEntities {
		payers = append(payers, payer.UserId)
	}

	// get distribution
	distributionEntities, err := database_io.GetExpenditureDistributions(query.ExpenditureId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	distribution := make([]ExpenditureGetResponseDistributionItem, 0)
	for _, dist := range distributionEntities {
		distribution = append(distribution, ExpenditureGetResponseDistributionItem{
			UserId: dist.UserId,
			Amount: Fraction{
				Numerator:   dist.Numerator,
				Denominator: dist.Denominator,
			},
		})
	}

	c.JSON(http.StatusOK, ExpenditureGetResponseDto{
		Name:         expenditureEntity.Name,
		TotalPrice:   expenditureEntity.TotalPrice,
		CurrencyCode: expenditureEntity.CurrencyCode,
		Category:     expenditureEntity.Category,
		PayersId:     payers,
		Distribution: distribution,
		PayedAt:      expenditureEntity.PayedAt,
	})
}

func CreateExpenditure(c *gin.Context) {
	uid := c.GetString("uid")

	var body ExpenditureCreateRequestDto
	if err := c.ShouldBindQuery(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	// check if session exists
	_, err := database_io.GetSession(body.SessionId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "session does not exist")
		return
	}

	// check if user is in session
	yes, err := platform.IsSessionMember(uid, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "user is not in session")
		return
	}

	// validate name
	if len(body.Name) == 0 {
		log.Error("name is empty")
		util2.AbortWithStrJson(c, http.StatusBadRequest, "name is empty")
		return
	}

	// validate total price
	calculatedTotalPrice := big.NewRat(0, 1)
	ratDistributions := make(map[string]*big.Rat)
	for _, dist := range body.Distribution {
		distribution := big.NewRat(dist.Amount.Numerator, dist.Amount.Denominator)
		calculatedTotalPrice.Add(calculatedTotalPrice, distribution)
		// ignore zero
		if distribution.Cmp(big.NewRat(0, 1)) == 0 {
			continue
		}
		ratDistributions[dist.UserId] = distribution
	}
	totalPriceRat := new(big.Rat)
	totalPriceRat.SetFloat64(*body.TotalPrice)
	if calculatedTotalPrice.Cmp(totalPriceRat) != 0 {
		log.Errorf("total price does not match distribution: (sum) %s != (total) %f", calculatedTotalPrice, body.TotalPrice)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "total price does not match distribution")
		return
	}

	// validate payers
	if len(body.PayersId) == 0 {
		log.Error("no payer specified")
		util2.AbortWithStrJson(c, http.StatusBadRequest, "no payer specified")
		return
	}

	// validate payers each
	for _, payerId := range body.PayersId {
		yes, err := platform.IsSessionMember(payerId, body.SessionId)
		if err != nil {
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		if !yes {
			util2.AbortWithStrJson(c, http.StatusBadRequest, "payer is not in session")
			return
		}
	}

	// validate currency code
	valid, err := platform.IsSupportedCurrencyInSession(body.CurrencyCode, body.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !valid {
		log.Errorf("invalid currency code: %s", body.CurrencyCode)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid currency code")
		return
	}

	// validate category
	if !platform.IsValidExpenditureCategory(body.Category) {
		log.Errorf("invalid category: %s", body.Category)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid category")
		return
	}

	if len(body.Items) > 0 {
		// validate distribution
		calculatedAllocatedPrice := make(map[string]*big.Rat)
		for _, item := range body.Items {
			price := new(big.Rat)
			price.SetFloat64(*item.Price)
			allocatedUserCnt := big.NewRat(int64(len(item.Allocations)), 1)
			dividedPrice := new(big.Rat)
			dividedPrice.Quo(price, allocatedUserCnt)

			for _, allocatedUid := range item.Allocations {
				allocatedPrice, ok := calculatedAllocatedPrice[allocatedUid]
				if !ok {
					allocatedPrice = new(big.Rat)
				}
				allocatedPrice.Add(allocatedPrice, dividedPrice)
				calculatedAllocatedPrice[allocatedUid] = allocatedPrice
			}
		}

		for userId, dist := range ratDistributions {
			allocatedPrice, ok := calculatedAllocatedPrice[userId]
			if !ok {
				log.Errorf("distribution user not found in items: %s", userId)
				util2.AbortWithStrJson(c, http.StatusBadRequest, "distribution user not found in items")
				return
			}
			if allocatedPrice.Cmp(dist) != 0 {
				log.Errorf("distribution amount does not match items: %s (calculated: %s)", dist, allocatedPrice)
				util2.AbortWithStrJson(c, http.StatusBadRequest, "distribution amount does not match items")
				return
			}
		}
	}

	tx, err := database.DB.Begin()
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// insert expenditure
	expenditureId := uuid.New().String()
	if err := database_io.InsertExpenditureTx(tx, database.ExpenditureEntity{
		ExpenditureId: expenditureId,
		Name:          body.Name,
		TotalPrice:    *body.TotalPrice,
		CurrencyCode:  body.CurrencyCode,
		Category:      body.Category,
		SessionId:     body.SessionId,
		PayedAt:       body.PayedAt,
	}); err != nil {
		_ = tx.Rollback()
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// insert payers
	for _, payerId := range body.PayersId {
		if err := database_io.InsertExpenditurePayerTx(tx, database.ExpenditurePayerEntity{
			ExpenditureId: expenditureId,
			UserId:        payerId,
		}); err != nil {
			_ = tx.Rollback()
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	}

	// insert distribution
	for userId, dist := range ratDistributions {
		if err := database_io.InsertExpenditureDistributionTx(tx, database.ExpenditureDistributionEntity{
			ExpenditureId: expenditureId,
			UserId:        userId,
			Numerator:     dist.Num().Int64(),
			Denominator:   dist.Denom().Int64(),
		}); err != nil {
			_ = tx.Rollback()
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusOK, nil)
}

func DeleteExpenditure(c *gin.Context) {
	uid := c.GetString("uid")

	var body ExpenditureDeleteRequestDto
	if err := c.ShouldBindQuery(&body); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	// get expenditure
	expenditureEntity, err := database_io.GetExpenditure(body.ExpenditureId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "expenditure does not exist")
		return
	}

	// check if session exists
	sessionEntity, err := database_io.GetSession(expenditureEntity.SessionId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "session does not exist")
		return
	}

	// check if user is in session
	yes, err := platform.IsSessionMember(uid, sessionEntity.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "user is not in session")
		return
	}

	tx, err := database.DB.Begin()
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err := database_io.DeleteExpenditureTx(tx, body.ExpenditureId); err != nil {
		_ = tx.Rollback()
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// TODO :: delete receipt if exists (and image file)

	if err := tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusOK, nil)
}

func UploadReceipt(c *gin.Context) {
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
	log.Debug("file temporally saved as: " + dest)

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

	totalAmount := taggunResp.TotalAmount.Data
	var totalAmountUnit *string // KRW, USD, JPY, ...
	totalAmountConfident := false
	if taggunResp.TotalAmount.ConfidenceLevel >= 0.5 {
		totalAmount = taggunResp.TotalAmount.Data
		totalAmountUnit = &taggunResp.TotalAmount.CurrencyCode
		totalAmountConfident = true
	} else {
		log.Debugf("total amount confidence level is too low: %v", taggunResp.TotalAmount.ConfidenceLevel)
	}

	type Item struct {
		Name   string
		Amount int
		Price  float64
	}
	items := make(map[int]Item)
	calculatedTotalAmount := 0.0
	for _, amountRaw := range taggunResp.Amounts {
		itemRaw, ok := items[amountRaw.Index]
		if !ok {
			itemRaw = Item{
				Amount: 1,
			}
		}
		itemRaw.Name = amountRaw.Text
		itemRaw.Price = amountRaw.Data
		calculatedTotalAmount += itemRaw.Price
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

	if totalAmountConfident {
		if calculatedTotalAmount != totalAmount {
			// add padding item
			items[-1] = Item{
				Name:   "unknown",
				Amount: 1,
				Price:  totalAmount - calculatedTotalAmount,
			}
		}
	}

	//log.Debugf("total amount: %v", totalAmount)
	//log.Debugf("total amount unit: %v", totalAmountUnit)

	subItems := make([]ExpenditureReceiptUploadResponseItem, 0)
	for _, item := range items {
		subItems = append(subItems, ExpenditureReceiptUploadResponseItem{
			Label: item.Name,
			Price: item.Price,
		})
	}

	resp := ExpenditureReceiptUploadResponseDto{
		CurrencyCode: totalAmountUnit,
		Items:        subItems,
	}
	c.JSON(http.StatusOK, resp)
}

func Categories(c *gin.Context) {
	categories := make([]string, 0)
	for _, category := range platform.ExpenditureCategories {
		categories = append(categories, category)
	}
	c.JSON(http.StatusOK, categories)
}

func UseExpenditureRouter(g *gin.RouterGroup) {
	rg := g.Group("/expenditure")
	rg.GET("/list", Expenditures)
	rg.GET("", Expenditure)
	rg.PUT("", CreateExpenditure)
	rg.DELETE("", DeleteExpenditure)

	rg.POST("/receipt", UploadReceipt)

	rg.GET("/categories", Categories)
}
