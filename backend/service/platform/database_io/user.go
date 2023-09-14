package database_io

import (
	"database/sql"
	"travel-ai/service/database"
)

func GetUser(uid string) (*database.UserEntity, error) {
	var userEntity database.UserEntity
	if err := database.DB.Get(&userEntity, `
		SELECT * FROM users WHERE uid = ?;`,
		uid,
	); err != nil {
		return nil, err
	}
	return &userEntity, nil
}

func UpdateUserTx(tx *sql.Tx, userEntity database.UserEntity) error {
	_, err := tx.Exec(`
		UPDATE users
		SET username = ?, profile_image = ?, allow_nickname_search = ?
		WHERE uid = ?;`,
		userEntity.Username, userEntity.ProfileImage, userEntity.AllowNicknameSearch,
		userEntity.UserId,
	)
	return err
}
