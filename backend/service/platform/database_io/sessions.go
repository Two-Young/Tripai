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

func GetSessionsByUid(uid string) ([]*database.SessionEntity, error) {
	// get sessions
	var sessions []*database.SessionEntity
	if err := database.DB.Select(&sessions,
		"SELECT s.* FROM user_sessions us RIGHT JOIN sessions s on us.sid = s.sid WHERE us.uid = ?;", uid); err != nil {
		return nil, err
	}
	return sessions, nil
}
