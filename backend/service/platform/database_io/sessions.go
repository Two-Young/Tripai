package database_io

import (
	"database/sql"
	"errors"
	"time"
	"travel-ai/service/database"
)

func InsertSessionTx(tx *sql.Tx, session database.SessionEntity) error {
	if _, err := tx.Exec(`
		INSERT INTO sessions(sid, session_code, creator_uid,
							 name, start_at, end_at, 
							 created_at, thumbnail_url) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
		session.SessionId, session.SessionCode, session.CreatorUserId,
		session.Name, session.StartAt, session.EndAt,
		session.CreatedAt, session.ThumbnailUrl,
	); err != nil {
		return err
	}
	return nil
}

func GetSession(sessionId string) (*database.SessionEntity, error) {
	// get session
	var session database.SessionEntity
	if err := database.DB.Get(&session, "SELECT * FROM sessions WHERE sid = ?;", sessionId); err != nil {
		return nil, err
	}
	return &session, nil
}

func GetSessionByCode(sessionCode string) (*database.SessionEntity, error) {
	// get session
	var session database.SessionEntity
	if err := database.DB.Get(&session, "SELECT * FROM sessions WHERE session_code = ?;", sessionCode); err != nil {
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

func InsertUserToSessionTx(tx *sql.Tx, entity database.UserSessionEntity) error {
	if _, err := tx.Exec(
		"INSERT INTO user_sessions(sid, uid, joined_at) VALUES (?, ?, ?);",
		entity.SessionId, entity.UserId, entity.JoinedAt); err != nil {
		return err
	}
	return nil
}

func DeleteUserFromSessionTx(tx *sql.Tx, entity database.UserSessionEntity) error {
	if _, err := tx.Exec(
		"DELETE FROM user_sessions WHERE sid = ? AND uid = ?;",
		entity.SessionId, entity.UserId); err != nil {
		return err
	}
	return nil
}

func InsertSessionInvitationTx(tx *sql.Tx, invitation database.SessionInvitationEntity) error {
	if _, err := tx.Exec(
		"INSERT INTO session_invitations(sid, uid) VALUES (?, ?);",
		invitation.SessionId, invitation.UserId); err != nil {
		return err
	}
	return nil
}

func DeleteSessionInvitationTx(tx *sql.Tx, invitation database.SessionInvitationEntity) error {
	if _, err := tx.Exec(
		"DELETE FROM session_invitations WHERE sid = ? AND uid = ?;",
		invitation.SessionId, invitation.UserId); err != nil {
		return err
	}
	return nil
}

type SessionInvitationUserEntity struct {
	database.UserEntity
	InvitedAt time.Time `db:"invited_at" json:"invited_at"`
}

func GetWaitingSessionInvitedUsers(sessionId string) ([]*SessionInvitationUserEntity, error) {
	var invitees []*SessionInvitationUserEntity
	if err := database.DB.Select(&invitees, `
			SELECT u.*, si.invited_at FROM session_invitations si LEFT JOIN users u on si.uid = u.uid WHERE sid = ?;
		`, sessionId); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return make([]*SessionInvitationUserEntity, 0), nil
		}
		return nil, err
	}
	return invitees, nil
}

type SessionInvitationSessionEntity struct {
	database.SessionEntity
	InvitedAt time.Time `db:"invited_at" json:"invited_at"`
}

func GetWaitingSessionInvitedSessions(userId string) ([]*SessionInvitationSessionEntity, error) {
	var sessions []*SessionInvitationSessionEntity
	if err := database.DB.Select(&sessions, `
			SELECT s.*, si.invited_at FROM session_invitations si LEFT JOIN sessions s on si.sid = s.sid WHERE uid = ?;
		`, userId); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return make([]*SessionInvitationSessionEntity, 0), nil
		}
		return nil, err
	}
	return sessions, nil
}

func InsertSessionJoinRequestTx(tx *sql.Tx, request database.SessionJoinRequestEntity) error {
	if _, err := tx.Exec(
		"INSERT INTO session_join_requests(sid, uid, requested_at) VALUES (?, ?, ?);",
		request.SessionId, request.UserId, request.RequestedAt); err != nil {
		return err
	}
	return nil
}

func DeleteSessionJoinRequestTx(tx *sql.Tx, request database.SessionJoinRequestEntity) error {
	if _, err := tx.Exec(
		"DELETE FROM session_join_requests WHERE sid = ? AND uid = ?;",
		request.SessionId, request.UserId); err != nil {
		return err
	}
	return nil
}

type SessionJoinRequestedUserEntity struct {
	database.UserEntity
	RequestedAt time.Time `db:"requested_at" json:"requested_at"`
}

func GetWaitingSessionJoinRequestedUsers(sessionId string) ([]*SessionJoinRequestedUserEntity, error) {
	var requesters []*SessionJoinRequestedUserEntity
	if err := database.DB.Select(&requesters, `
			SELECT u.*, sj.requested_at FROM session_join_requests sj LEFT JOIN users u on sj.uid = u.uid WHERE sid = ?;
		`, sessionId); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return make([]*SessionJoinRequestedUserEntity, 0), nil
		}
		return nil, err
	}
	return requesters, nil
}

type SessionJoinRequestedSessionEntity struct {
	database.SessionEntity
	RequestedAt time.Time `db:"requested_at" json:"requested_at"`
}

func GetWaitingSessionJoinRequestedSessions(userId string) ([]*SessionJoinRequestedSessionEntity, error) {
	var sessions []*SessionJoinRequestedSessionEntity
	if err := database.DB.Select(&sessions, `
			SELECT s.*, sj.requested_at FROM session_join_requests sj LEFT JOIN sessions s on sj.sid = s.sid WHERE uid = ?;
		`, userId); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return make([]*SessionJoinRequestedSessionEntity, 0), nil
		}
		return nil, err
	}
	return sessions, nil
}
