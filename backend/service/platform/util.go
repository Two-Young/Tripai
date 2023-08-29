package platform

import (
	"database/sql"
	"errors"
	"fmt"
	"regexp"
	"strconv"
	"time"
	"travel-ai/service/database"
	"travel-ai/service/platform/database_io"
)

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

func CheckPermissionBySessionId(uid string, sessionId string) (bool, error) {
	_, err := database.DB.Exec("SELECT * FROM user_sessions WHERE uid = ? AND sid = ?;", uid, sessionId)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func CheckPermissionByReceiptId(uid string, receiptId string) (bool, error) {
	receipt, err := database_io.GetReceipt(receiptId)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	yes, err := CheckPermissionBySessionId(uid, receipt.SessionId)
	if !yes {
		if err != nil {
			return false, err
		}
		return false, nil
	}
	return true, nil
}
