package database_io

import (
	"database/sql"
	"travel-ai/service/database"
)

func InsertChatRoomTx(tx *sql.Tx, chatroom database.ChatRoomEntity) error {
	if _, err := tx.Exec(`
		INSERT INTO chatrooms(cid, sid, created_at) 
		VALUES (?, ?, ?);`,
		chatroom.ChatroomId, chatroom.SessionId, chatroom.CreatedAt,
	); err != nil {
		return err
	}
	return nil
}

func GetChatRooms(sessionId string) ([]database.ChatRoomEntity, error) {
	var sessions []database.ChatRoomEntity
	if err := database.DB.Select(&sessions,
		"SELECT * FROM chatrooms WHERE sid = ?;", sessionId); err != nil {
		return nil, err
	}
	return sessions, nil
}

func GetChatRoom(chatRoomId string) (*database.ChatRoomEntity, error) {
	var chatRoom database.ChatRoomEntity
	if err := database.DB.Get(&chatRoom,
		"SELECT * FROM chatrooms WHERE cid = ?;", chatRoomId); err != nil {
		return nil, err
	}
	return &chatRoom, nil
}

func InsertChatRoomUserTx(tx *sql.Tx, entity database.ChatRoomsUserEntity) error {
	if _, err := tx.Exec(
		"INSERT INTO chatroom_users(cid, uid) VALUES (?, ?);",
		entity.ChatroomId, entity.UserId); err != nil {
		return err
	}
	return nil
}
func GetUsersByChatRoomId(chatRoomId string) ([]database.UserEntity, error) {
	var users []database.UserEntity
	if err := database.DB.Select(&users,
		"SELECT * FROM users WHERE uid IN (SELECT uid FROM chatroom_users WHERE cid = ?);", chatRoomId); err != nil {
		return nil, err
	}
	return users, nil
}

type ChatRoomUserEntity struct {
	database.ChatRoomEntity
	Users []database.UserEntity `json:"users"`
}

func GetChatRoomsWithUserInfoByUserId(sessionId string) ([]ChatRoomUserEntity, error) {
	var chatRooms []ChatRoomUserEntity
	if err := database.DB.Select(&chatRooms,
		"SELECT * FROM chatrooms WHERE cid IN (SELECT cid FROM chatroom_users WHERE uid = ?);", sessionId); err != nil {
		return nil, err
	}
	for i, chatRoom := range chatRooms {
		users, err := GetUsersByChatRoomId(chatRoom.ChatroomId)
		if err != nil {
			return nil, err
		}
		chatRooms[i].Users = users
	}
	return chatRooms, nil
}
