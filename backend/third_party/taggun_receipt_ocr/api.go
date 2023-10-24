package taggun_receipt_ocr

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

type TaggunRespNames struct {
	De   string `json:"de"`
	En   string `json:"en"`
	Es   string `json:"es"`
	Fr   string `json:"fr"`
	Ja   string `json:"ja"`
	PtBr string `json:"pt-BR"`
	Ru   string `json:"ru"`
	ZhCn string `json:"zh-CN"`
}

type TaggunRespCoordinate struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type TaggunRespAmount struct {
	Data            float64                  `json:"data"`
	ConfidenceLevel float64                  `json:"confidenceLevel"`
	Text            string                   `json:"text"`
	Index           int                      `json:"index"`
	Keyword         string                   `json:"keyword"`
	CurrencyCode    string                   `json:"currency_code"`
	Regions         [][]TaggunRespCoordinate `json:"regions"`
}

type TaggunReceiptOcrResponse struct {
	Location struct {
		City struct {
			GeonameId int             `json:"geoname_id"`
			Names     TaggunRespNames `json:"names"`
		} `json:"city"`
		Continent struct {
			Code      string          `json:"code"`
			GeonameId int             `json:"geoname_id"`
			Names     TaggunRespNames `json:"names"`
		} `json:"continent"`
		Country struct {
			GeonameId int             `json:"geoname_id"`
			IsoCode   string          `json:"iso_code"`
			Names     TaggunRespNames `json:"names"`
		} `json:"country"`
		Location struct {
			AccuracyRadius int     `json:"accuracy_radius"`
			Latitude       float64 `json:"latitude"`
			Longitude      float64 `json:"longitude"`
			TimeZone       string  `json:"time_zone"`
		} `json:"location"`
		Postal struct {
			Code string `json:"code"`
		} `json:"postal"`
		RegisteredCountry struct {
			GeonameId int             `json:"geoname_id"`
			IsoCode   string          `json:"iso_code"`
			Names     TaggunRespNames `json:"names"`
		} `json:"registered_country"`
		SubDivisions []struct {
			GeonameId int             `json:"geoname_id"`
			IsoCode   string          `json:"iso_code"`
			Names     TaggunRespNames `json:"names"`
		} `json:"subdivisions"`
	} `json:"location"`
	TotalAmount     TaggunRespAmount `json:"totalAmount"`
	TaxAmount       TaggunRespAmount `json:"taxAmount"`
	ConfidenceLevel float64          `json:"confidenceLevel"`
	Date            struct {
		// rest of the fields are not sure
		ConfidenceLevel float64 `json:"confidenceLevel"`
	} `json:"date"`
	DueDate struct {
		// rest of the fields are not sure
		ConfidenceLevel float64 `json:"confidenceLevel"`
	}
	Text struct {
		Text    string                 `json:"text"`
		Regions []TaggunRespCoordinate `json:"regions"`
	}
	Amounts []struct {
		Data    float64                  `json:"data"`
		Index   int                      `json:"index"`
		Regions [][]TaggunRespCoordinate `json:"regions"`
		Text    string                   `json:"text"`
	} `json:"amounts"`
	Numbers []struct {
		Data    int                      `json:"data"`
		Index   int                      `json:"index"`
		Text    string                   `json:"text"`
		Regions [][]TaggunRespCoordinate `json:"regions"`
	} `json:"numbers"`
	Entities struct {
		IBAN struct {
			ConfidenceLevel float64 `json:"confidenceLevel"`
		} `json:"IBAN"`
		InvoiceNumber struct {
			Data            string  `json:"data"`
			ConfidenceLevel float64 `json:"confidenceLevel"`
			Text            string  `json:"text"`
			Keyword         string  `json:"keyword"`
		} `json:"invoiceNumber"`
		MultiTaxLineItems []struct {
			Data struct {
				TaxType struct {
					Text string `json:"text"`
					Data string `json:"data"`
				} `json:"taxType"`
				TaxRate struct {
					Text string  `json:"text"`
					Data float64 `json:"data"`
				} `json:"taxRate"`
				TaxAmount struct {
					Text string  `json:"text"`
					Data float64 `json:"data"`
				} `json:"taxAmount"`
			} `json:"data"`
			ConfidenceLevel float64                  `json:"confidenceLevel"`
			Index           int                      `json:"index"`
			Regions         [][]TaggunRespCoordinate `json:"regions"`
		} `json:"multiTaxLineItems"`
		ReceiptNumber struct {
			ConfidenceLevel float64 `json:"confidenceLevel"`
		} `json:"receiptNumber"`
		Last4 struct {
			ConfidenceLevel float64 `json:"confidenceLevel"`
		} `json:"last4"`
	} `json:"entities"`
	LineAmounts         []interface{} `json:"lineAmounts"`
	ItemsCount          interface{}   `json:"itemsCount"`
	PaymentType         interface{}   `json:"paymentType"`
	MerchantName        interface{}   `json:"merchantName"`
	MerchantAddress     interface{}   `json:"merchantAddress"`
	MerchantCity        interface{}   `json:"merchantCity"`
	MerchantState       interface{}   `json:"merchantState"`
	MerchantCountryCode interface{}   `json:"merchantCountryCode"`
	MerchantTypes       interface{}   `json:"merchantTypes"`
	MerchantPostalCode  interface{}   `json:"merchantPostalCode"`
	Elapsed             float64       `json:"elapsed"`
}

func ParseReceipt(f *os.File) (*TaggunReceiptOcrResponse, error) {
	url := "https://api.taggun.io/api/receipt/v1/verbose/file"
	payload := &bytes.Buffer{}
	writer := multipart.NewWriter(payload)
	filePart, _ := writer.CreateFormFile("file", f.Name())
	if _, err := io.Copy(filePart, f); err != nil {
		return nil, err
	}
	if err := writer.Close(); err != nil {
		return nil, err
	}

	contentType := fmt.Sprintf("multipart/form-data; boundary=%v", writer.Boundary())
	req, _ := http.NewRequest("POST", url, payload)
	req.Header.Add("accept", "application/json")
	req.Header.Add("content-type", contentType)
	req.Header.Add("apikey", GetTaggunApiKey())
	res, _ := http.DefaultClient.Do(req)
	defer res.Body.Close()

	body, err := io.ReadAll(res.Body)
	if err != nil {
		return nil, err
	}

	// parse body
	var taggunResp TaggunReceiptOcrResponse
	if err := json.Unmarshal(body, &taggunResp); err != nil {
		return nil, err
	}
	return &taggunResp, nil
}
