package free_currencies

import "github.com/everapihq/freecurrencyapi-go"

var ApiKey string

func Initialize() {
	freecurrencyapi.Init(ApiKey)
}

func GetAvailableCurrencies() {
	//freecurrencyapi.Currencies()
}

func GetStatus() {
	freecurrencyapi.Status()
}
