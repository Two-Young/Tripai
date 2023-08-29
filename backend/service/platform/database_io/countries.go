package database_io

import "travel-ai/service/database"

func GetCountriesBySessionId(sessionId string) ([]*database.CountryEntity, error) {
	var countries []*database.CountryEntity
	if err := database.DB.Select(&countries, "SELECT * FROM countries WHERE sid = ?;", sessionId); err != nil {
		return nil, err
	}
	return countries, nil
}
