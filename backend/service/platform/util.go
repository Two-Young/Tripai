package platform

import (
	"database/sql"
	"time"
	"travel-ai/service/database"
)

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

func DidParticipateInSession(uid string, sessionId string) (bool, error) {
	_, err := database.DB.Exec("SELECT * FROM user_sessions WHERE uid = ? AND sid = ?;", uid, sessionId)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
