package fawazahmed0_currency

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

func GetExchangeRate(from string, to string) (float64, error) {
	// lowercase
	uFrom := strings.ToLower(from)
	uTo := strings.ToLower(to)

	url := fmt.Sprintf("https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/%s/%s.min.json", uFrom, uTo)
	resp, err := http.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	// check if response is 200
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("response status code is %d", resp.StatusCode)
	}

	// parse response
	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return 0, err
	}

	value := data[uTo].(float64)
	return value, nil
}
