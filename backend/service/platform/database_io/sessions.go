package database_io

import (
	"travel-ai/service/database"
)

func GetSession(sessionId string) (*database.SessionEntity, error) {
	// get session
	var session database.SessionEntity
	if err := database.DB.Get(&session, "SELECT * FROM sessions WHERE sid = ?;", sessionId); err != nil {
		return nil, err
	}
	return &session, nil
}
