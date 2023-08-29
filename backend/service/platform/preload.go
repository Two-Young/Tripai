package platform

import (
	"encoding/json"
	"net/http"
)

var (
	CountriesMap map[string]Country
)

type Currency struct {
	Code   string `json:"code"`
	Name   string `json:"name"`
	Symbol string `json:"symbol"`
}

type Country struct {
	CCA2       string     `json:"country_code"`
	CCA3       string     `json:"country_code3"`
	Alt        string     `json:"alt"`
	Png        string     `json:"png"`
	Svg        string     `json:"svg"`
	CommonName string     `json:"common_name"`
	Region     string     `json:"region"`
	Currencies []Currency `json:"currencies"`
}

func Preload() {
	resp, err := http.Get("https://restcountries.com/v3.1/all?fields=name,flags,cca2,cca3,region,currencies")
	if err != nil {
		return
	}
	defer resp.Body.Close()
	var countriesData []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&countriesData); err != nil {
		return
	}

	CountriesMap = make(map[string]Country)
	for _, country := range countriesData {
		cca2 := country["cca2"].(string)
		cca3 := country["cca3"].(string)

		currencies := make([]Currency, 0)
		for code, currency := range country["currencies"].(map[string]interface{}) {
			currencies = append(currencies, Currency{
				Code:   code,
				Name:   currency.(map[string]interface{})["name"].(string),
				Symbol: currency.(map[string]interface{})["symbol"].(string),
			})
		}

		CountriesMap[cca2] = Country{
			CCA2:       cca2,
			CCA3:       cca3,
			Region:     country["region"].(string),
			CommonName: country["name"].(map[string]interface{})["common"].(string),
			Alt:        country["name"].(map[string]interface{})["common"].(string),
			Png:        country["flags"].(map[string]interface{})["png"].(string),
			Svg:        country["flags"].(map[string]interface{})["svg"].(string),
			Currencies: currencies,
		}
	}
}
