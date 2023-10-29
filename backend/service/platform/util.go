package platform

import (
	"fmt"
	"math/rand"
	"os"
	"regexp"
	"strconv"
	"time"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform/database_io"
	"travel-ai/third_party/fawazahmed0_currency"
)

func IsDebugMode() bool {
	return os.Getenv("DEBUG") == "true"
}

func GenerateTenLengthCode() string {
	const length = 10
	const charset = "0123456789"
	result := ""
	for i := 0; i < length; i++ {
		result += string(charset[rand.Intn(len(charset))])
	}
	return result
}

func ExtractNumberFromString(str string) (float64, error) {
	re := regexp.MustCompile(`[0-9]+(\.[0-9]*)?`)
	match := re.FindString(str)
	if match == "" {
		return 0, fmt.Errorf("couldn't find number in string: %v", str)
	}
	price, err := strconv.ParseFloat(match, 64)
	if err != nil {
		return 0, err
	}
	return price, nil
}

func GetDayCode(date time.Time) int64 {
	return date.Unix() / 86400
}

func ConvertDateString(dateString string) (time.Time, error) {
	date, err := time.Parse("2006-01-02", dateString)
	if err != nil {
		return time.Now(), err
	}
	return date, nil
}

func ToDayString(date time.Time) string {
	return date.Format("2006-01-02")
}

func ConvertDateInt64(dateInt64 int64) (time.Time, error) {
	if dateInt64 <= 0 {
		return time.Now(), nil
	}
	date := time.UnixMilli(dateInt64)
	return date, nil
}

func FindSessionIdByLocationId(locationId string) (string, error) {
	var sessionId string
	err := database.DB.QueryRow("SELECT sid FROM locations WHERE lid = ?;", locationId).Scan(&sessionId)
	if err != nil {
		return "", err
	}
	return sessionId, nil
}

func IsWaitingForSessionJoinRequestConfirm(uid string, sessionId string) (bool, error) {
	var count int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM session_join_requests WHERE uid = ? AND sid = ?;", uid, sessionId).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// IsWaitingForSessionInvitation checks if user is on session invitation waiting list
func IsWaitingForSessionInvitation(uid string, sessionId string) (bool, error) {
	var count int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM session_invitations WHERE uid = ? AND sid = ?;", uid, sessionId).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func IsSessionCreator(uid string, sessionId string) (bool, error) {
	var creatorUid string
	err := database.DB.QueryRow("SELECT creator_uid FROM sessions WHERE sid = ?;", sessionId).Scan(&creatorUid)
	if err != nil {
		return false, err
	}
	return uid == creatorUid, nil
}

func IsSessionMember(uid string, sessionId string) (bool, error) {
	var exists bool
	if err := database.DB.QueryRow("SELECT EXISTS(SELECT * FROM user_sessions WHERE uid = ? AND sid = ?);", uid, sessionId).Scan(&exists); err != nil {
		return false, err
	}
	return exists, nil
}

func IsInvitedToSession(uid string, sessionId string) (bool, error) {
	var exists bool
	if err := database.DB.QueryRow("SELECT EXISTS(SELECT * FROM session_invitations WHERE uid = ? AND sid = ?);", uid, sessionId).Scan(&exists); err != nil {
		return false, err
	}
	return exists, nil
}

func GetSupportedCurrencies() (map[string]Currency, error) {
	currencies := make(map[string]Currency)
	for _, country := range CountriesMap {
		for _, currency := range country.Currencies {
			currencies[currency.Code] = Currency{
				Code:   currency.Code,
				Name:   currency.Name,
				Symbol: currency.Symbol,
			}
		}
	}
	return currencies, nil
}

func IsSupportedCurrency(currencyCode string) (bool, error) {
	supportedCurrencies, err := GetSupportedCurrencies()
	if err != nil {
		return false, err
	}
	_, ok := supportedCurrencies[currencyCode]
	return ok, nil
}

func GetSupportedSessionCurrencies(sessionId string) (map[string]Currency, error) {
	countriesEntities, err := database_io.GetCountriesBySessionId(sessionId)
	if err != nil {
		return nil, err
	}

	supportedCurrencies := make(map[string]Currency)
	for _, currencyEntity := range countriesEntities {
		cca2 := currencyEntity.CountryCode
		if cca2 == nil {
			log.Debug("country code is nil")
			continue
		}
		country, ok := CountriesMap[*cca2]
		if !ok {
			log.Debugf("country not found with cca2: %s", *cca2)
			continue
		}
		for _, currency := range country.Currencies {
			supportedCurrencies[currency.Code] = Currency{
				Code:   currency.Code,
				Name:   currency.Name,
				Symbol: currency.Symbol,
			}
		}
	}
	return supportedCurrencies, nil
}

func IsSupportedCurrencyInSession(currencyCode string, sessionId string) (bool, error) {
	currencies, err := GetSupportedSessionCurrencies(sessionId)
	if err != nil {
		return false, err
	}
	_, ok := currencies[currencyCode]
	return ok, nil
}

func GetSupportedSessionCurrenciesByCountry(sessionId string) (map[string][]Currency, error) {
	countriesEntities, err := database_io.GetCountriesBySessionId(sessionId)
	if err != nil {
		return nil, err
	}

	supportedCurrencies := make(map[string][]Currency)
	for _, currencyEntity := range countriesEntities {
		cca2 := currencyEntity.CountryCode
		if cca2 == nil {
			log.Debug("country code is nil")
			continue
		}
		country, ok := CountriesMap[*cca2]
		if !ok {
			log.Debugf("country not found with cca2: %s", *cca2)
			continue
		}
		supportedCurrencies[country.CCA2] = make([]Currency, 0)
		currencyList := supportedCurrencies[country.CCA2]

		for _, currency := range country.Currencies {
			currencyList = append(currencyList, Currency{
				Code:   currency.Code,
				Name:   currency.Name,
				Symbol: currency.Symbol,
			})
		}
		supportedCurrencies[country.CCA2] = currencyList
	}

	return supportedCurrencies, nil
}

func IsValidExpenditureCategory(category string) bool {
	_, ok := ExpenditureCategories[category]
	return ok
}

func GetUpdatedExchangeRate(from string, to string) (float64, error) {
	ex, err := database_io.GetExchangeRate(from, to)
	needUpdate := err != nil || ex.UpdatedAt.Unix() < time.Now().Unix()-86400
	if err != nil {
		log.Error(err)
	}

	// if rate update is needed (1 day has passed)
	if needUpdate {
		rate, err := fawazahmed0_currency.GetExchangeRate(from, to)
		if err != nil {
			return 0, err
		}
		if err := database_io.UpsertExchangeRate(from, to, rate); err != nil {
			log.Error(err)
		}
		return rate, nil
	}

	return ex.Rate, nil
}

func Exchange(from string, to string, amount float64) (float64, error) {
	if from == to {
		return amount, nil
	}
	rate, err := GetUpdatedExchangeRate(from, to)
	if err != nil {
		return 0, err
	}
	return rate * amount, nil
}
