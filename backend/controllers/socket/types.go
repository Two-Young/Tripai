package socket

import (
	socketio "github.com/googollee/go-socket.io"
	"travel-ai/service/database"
)

type UserSocket struct {
	User database.UserEntity
	Conn socketio.Conn
}

type Manager struct {
	users   map[string]UserSocket
	sockets map[string]UserSocket
	Io      *socketio.Server
}

func NewSocketManager() *Manager {
	return &Manager{
		users:   make(map[string]UserSocket),
		sockets: make(map[string]UserSocket),
	}
}

func (sm *Manager) AddUser(user database.UserEntity, conn socketio.Conn) {
	userSocket := UserSocket{
		User: user,
		Conn: conn,
	}
	sm.users[user.UserId] = userSocket
	sm.sockets[conn.ID()] = userSocket
}

func (sm *Manager) RemoveUserByUserId(userId string) {
	userSocket, ok := sm.users[userId]
	if ok {
		delete(sm.sockets, userSocket.Conn.ID())
		delete(sm.users, userId)
	}
}

func (sm *Manager) RemoveUserByConnId(connId string) {
	userSocket, ok := sm.sockets[connId]
	if ok {
		delete(sm.sockets, connId)
		delete(sm.users, userSocket.User.UserId)
	}
}

func (sm *Manager) GetUserByUserId(userId string) (UserSocket, bool) {
	userSocket, ok := sm.users[userId]
	return userSocket, ok
}

func (sm *Manager) GetUserByConnId(connId string) (UserSocket, bool) {
	userSocket, ok := sm.sockets[connId]
	return userSocket, ok
}

func (sm *Manager) GetUsers() map[string]UserSocket {
	return sm.users
}

// -------------------------------------------------------------------------------------

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data"`
	Error   *string     `json:"error"`
}

func NewResponse(success bool, data interface{}, err *string) Response {
	return Response{
		Success: success,
		Data:    data,
		Error:   err,
	}
}

func NewSuccess(data interface{}) Response {
	return NewResponse(true, data, nil)
}

func NewFailure(errMsg string) Response {
	return NewResponse(false, nil, &errMsg)
}

// -------------------------------------------------------------------------------------

type ChatMessage struct {
	SenderUserId       string  `json:"senderUserId"`
	SenderUsername     *string `json:"senderUsername"`
	SenderProfileImage *string `json:"senderProfileImage"`
	Content            string  `json:"content"`
	Timestamp          int64   `json:"timestamp"`
}

func NewChatMessage(senderUserId string, senderUsername *string, senderProfileImage *string, content string, timestamp int64) ChatMessage {
	return ChatMessage{
		SenderUserId:       senderUserId,
		SenderUsername:     senderUsername,
		SenderProfileImage: senderProfileImage,
		Content:            content,
		Timestamp:          timestamp,
	}
}

func ChatMessageFromStr(str string) (ChatMessage, error) {
	var chatMessage ChatMessage
	if err := bindJson(str, &chatMessage); err != nil {
		return ChatMessage{}, err
	}
	return chatMessage, nil
}
