package platform

import (
	"encoding/json"
	"net/http"
)

var (
	CountriesMap map[string]Country
)

type Country struct {
	CountryCode string `json:"country_code"`
	Alt         string `json:"alt"`
	Png         string `json:"png"`
	Svg         string `json:"svg"`
	CommonName  string `json:"common_name"`
	Region      string `json:"region"`
}

func Preload() {
	resp, err := http.Get("https://restcountries.com/v3.1/all?fields=name,flags,cca2,region")
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
		CountriesMap[country["cca2"].(string)] = Country{
			CountryCode: country["cca2"].(string),
			Region:      country["region"].(string),
			CommonName:  country["name"].(map[string]interface{})["common"].(string),
			Alt:         country["name"].(map[string]interface{})["common"].(string),
			Png:         country["flags"].(map[string]interface{})["png"].(string),
			Svg:         country["flags"].(map[string]interface{})["svg"].(string),
		}
	}
}
