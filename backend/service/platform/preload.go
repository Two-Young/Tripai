package platform

import (
	"encoding/json"
	"net/http"
	"os"
	"time"
	"travel-ai/log"
	"travel-ai/util"
)

var (
	CountriesMap  map[string]Country
	AppServerHost string
	AppServerPort = os.Getenv("APP_SERVER_PORT")
	DebugMode     = os.Getenv("DEBUG") == "true"
)

func Preload() error {
	log.Debugf("Preload started...")
	// load countries & currency data
	var countriesData []map[string]interface{}
	client := &http.Client{
		Timeout: 3 * time.Second,
		Transport: &http.Transport{
			TLSHandshakeTimeout: 3 * time.Second,
		},
	}
	req, err := http.NewRequest("GET", "https://restcountries.com/v3.1/all?fields=name,flags,cca2,cca3,region,currencies", nil)
	if err != nil {
		return err
	}
	resp, err := client.Do(req)
	if err == nil {
		defer resp.Body.Close()
		if err := json.NewDecoder(resp.Body).Decode(&countriesData); err != nil {
			return err
		}
	} else {
		// try to load from local file
		log.Error(err)
		log.Warnf("failed to load countries data from restcountries api, so loading from local cache...")
		path := util.GetRootDirectory() + "/files/resources/country_currencies.json"
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()

		if err := json.NewDecoder(file).Decode(&countriesData); err != nil {
			return err
		}
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

	// load public ip
	ipv4, err := util.GetPublicIp()
	if err != nil {
		return err
	}

	AppServerHost = ipv4
	AppServerPort = os.Getenv("APP_SERVER_PORT")
	log.Debugf("server is running on public ip: %s:%s", AppServerHost, AppServerPort)
	return nil
}
