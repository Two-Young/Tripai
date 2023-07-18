package platform

import "time"

func ValidateDateString(dateString string) (time.Time, error) {
	date, err := time.Parse("2023-01-02", dateString)
	if err != nil {
		return time.Now(), err
	}
	return date, nil
}
