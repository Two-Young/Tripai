package database_io

import (
	"fmt"
	"github.com/jmoiron/sqlx"
	"time"
	"travel-ai/service/database"
)

type FriendInfoEntity struct {
	UserId       string  `db:"uid" json:"user_id"`
	Id           *string `db:"id" json:"id"`
	UserCode     string  `db:"user_code" json:"user_code"`
	Username     *string `db:"username" json:"username"`
	ProfileImage *string `db:"profile_image" json:"profile_image"`
	Platform     *string `db:"platform" json:"platform"`

	ConfirmedAt *time.Time `db:"confirmed_at" json:"confirmed_at"`
}

func GetFriendsRelationInfo(uid string) ([]*FriendInfoEntity, error) {
	var friends []*FriendInfoEntity
	if err := database.DB.Select(&friends, `
		SELECT u.*, uf.confirmed_at
		FROM users_friends uf
		JOIN users u ON uf.requested_uid = u.uid
		WHERE uf.uid = ? AND uf.accepted = TRUE
		UNION
		SELECT u.*, uf.confirmed_at
		FROM users_friends uf
		JOIN users u ON uf.uid = u.uid
		WHERE uf.requested_uid = ? AND uf.accepted = TRUE;`,
		uid, uid,
	); err != nil {
		return nil, err
	}
	return friends, nil
}

type FriendRequestEntity struct {
	database.UserEntity
	RequestedAt time.Time `db:"requested_at" json:"requested_at"`
}

func GetSentFriendsRequestWaitings(uid string) ([]*FriendRequestEntity, error) {
	var friends []*FriendRequestEntity
	if err := database.DB.Select(&friends, `
		SELECT u.*, uf.requested_at
		FROM users_friends uf
		JOIN users u ON uf.requested_uid = u.uid
		WHERE uf.uid = ? AND uf.accepted = FALSE;`,
		uid,
	); err != nil {
		return nil, err
	}
	return friends, nil
}

func GetReceivedFriendsRequestWaitings(uid string) ([]*FriendRequestEntity, error) {
	var friends []*FriendRequestEntity
	if err := database.DB.Select(&friends, `
		SELECT u.*, uf.requested_at
		FROM users_friends uf
		JOIN users u ON uf.uid = u.uid
		WHERE uf.requested_uid = ? AND uf.accepted = FALSE;`,
		uid,
	); err != nil {
		return nil, err
	}
	return friends, nil
}

type FriendRelationInfoEntity struct {
	UserId       *string `db:"uid" json:"user_id"`
	Id           *string `db:"id" json:"id"`
	UserCode     *string `db:"user_code" json:"user_code"`
	Username     *string `db:"username" json:"username"`
	ProfileImage *string `db:"profile_image" json:"profile_image"`
	Platform     *string `db:"platform" json:"platform"`

	RequestedUserId string     `db:"requested_uid" json:"requested_user_id"`
	Accepted        bool       `db:"accepted" json:"accepted"`
	RequestedAt     time.Time  `db:"requested_at" json:"requested_at"`
	ConfirmedAt     *time.Time `db:"confirmed_at" json:"confirmed_at"`
}

func GetSingleFriendRelationInfo(uid string, targetUid string) ([]*FriendRelationInfoEntity, error) {
	var friends []*FriendRelationInfoEntity
	if err := database.DB.Select(&friends, `
		SELECT u.*, uf.confirmed_at, uf.requested_uid
		FROM users_friends uf
		JOIN users u ON uf.requested_uid = u.uid
		WHERE uf.uid = ? AND uf.requested_uid = ?
		UNION
		SELECT u.*, uf.confirmed_at, uf.requested_uid
		FROM users_friends uf
		JOIN users u ON uf.uid = u.uid
		WHERE uf.requested_uid = ? AND uf.uid = ?;`,
		uid, targetUid, targetUid, uid,
	); err != nil {
		return nil, err
	}
	return friends, nil
}

func InsertFriendRelationTx(tx *sqlx.Tx, receipt database.FriendEntity) error {
	if _, err := tx.Exec(
		"INSERT INTO users_friends (uid, requested_uid, accepted, requested_at, confirmed_at) VALUES (?, ?, ?, ?, ?)",
		receipt.UserId, receipt.RequestedUserId, receipt.Accepted, receipt.RequestedAt, receipt.ConfirmedAt,
	); err != nil {
		return err
	}
	return nil
}

func UpdateFriendRelationTx(tx *sqlx.Tx, receipt database.FriendEntity) error {
	if _, err := tx.Exec(
		"UPDATE users_friends SET accepted = ?, confirmed_at = ? WHERE uid = ? AND requested_uid = ?",
		receipt.Accepted, receipt.ConfirmedAt, receipt.UserId, receipt.RequestedUserId,
	); err != nil {
		return err
	}
	return nil
}

func DeleteFriendRelationTx(tx *sqlx.Tx, receivedUid string, requesterUid string) error {
	if _, err := tx.Exec(
		"DELETE FROM users_friends WHERE uid = ? AND requested_uid = ?",
		receivedUid, requesterUid,
	); err != nil {
		return err
	}
	return nil
}

// DeleteFriendAcceptedRelationTx deletes a friend relation that is accepted (args order doesn't matter)
func DeleteFriendAcceptedRelationTx(tx *sqlx.Tx, uid1 string, uid2 string) error {
	if _, err := tx.Exec(`
		DELETE FROM users_friends 
		       WHERE ((uid = ? AND requested_uid = ?) OR (requested_uid = ? AND uid = ?))
		         AND accepted = TRUE
	`, uid1, uid2, uid1, uid2); err != nil {
		return err
	}
	return nil
}

func GetFriendByKeyword(keyword string) ([]*FriendInfoEntity, error) {
	var friends []*FriendInfoEntity
	if err := database.DB.Select(&friends, `
		SELECT *
		FROM users
		WHERE user_code = ? OR (allow_nickname_search = TRUE AND username like ?);`,
		keyword, fmt.Sprintf("%%%s%%", keyword),
	); err != nil {
		return nil, err
	}
	return friends, nil
}
