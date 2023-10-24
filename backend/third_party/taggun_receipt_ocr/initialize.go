package taggun_receipt_ocr

import "os"

var taggunApiKey string

func Initialize() {
	// get api key from env
	taggunApiKey = os.Getenv("TAGGUN_API_KEY")
}

func GetTaggunApiKey() string {
	return taggunApiKey
}
