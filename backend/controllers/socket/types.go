package socket

import (
	"encoding/json"
	socketio "github.com/googollee/go-socket.io"
	"travel-ai/log"
	"travel-ai/service/database"
)

// types
const (
	EventTest = "test"

	EventSessionChatGetMessages            = "sessionChat/getMessages"
	EventSessionChatSendMessage            = "sessionChat/sendMessage"
	EventSessionChatMessage                = "sessionChat/message"
	EventSessionChatUserJoined             = "sessionChat/userJoined"
	EventSessionChatSendAssistantMessage   = "sessionChat/sendAssistantMessage"
	EventSessionChatAssistantMessageStart  = "sessionChat/assistantMessageStart"
	EventSessionChatAssistantMessageStream = "sessionChat/assistantMessageStream"
	EventSessionChatAssistantMessageEnd    = "sessionChat/assistantMessageEnd"
	EventSessionChatAssistantMessageError  = "sessionChat/assistantMessageError"

	EventBudgetCreated              = "budget/created"
	EventExpenditureCreated         = "expenditure/created"
	EventExpenditureDeleted         = "expenditure/deleted"
	EventFriendRequestReceived      = "friend/requestReceived"
	EventFriendConnected            = "friend/connected"
	EventLocationCreated            = "location/created"
	EventLocationDeleted            = "location/deleted"
	EventScheduleCreated            = "schedule/created"
	EventScheduleDeleted            = "schedule/deleted"
	EventSettlementChanged          = "settlement/changed"
	EventSessionMemberJoined        = "session/memberJoined"
	EventSessionMemberLeft          = "session/memberLeft"
	EventSessionMemberInvited       = "session/memberInvited"
	EventSessionMemberJoinRequested = "session/memberJoinRequested"
	EventSessionDeleted             = "session/deleted"
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

// Broadcast broadcasts to all users in the session
func (sm *Manager) Broadcast(sessionId string, event string, data interface{}) {
	sm.Io.ForEach("/", RoomKey(sessionId), func(conn socketio.Conn) {
		userSocket, ok := sm.sockets[conn.ID()]
		if !ok {
			log.Warnf("Socket not found for connId %s", conn.ID())
			return
		}
		log.Debugf("[%s] broadcast -> %s: %v", event, userSocket.User.Username, data)
	})
	sm.Io.BroadcastToRoom("/", RoomKey(sessionId), event, NewSuccess(data))
}

// Multicast broadcasts to all users in the session except the sender
func (sm *Manager) Multicast(sessionId string, senderUserId string, event string, data interface{}) {
	// get sender's socket
	senderSocket, ok := sm.GetUserByUserId(senderUserId)
	if !ok {
		log.Debugf("[%s] Socket not found for userId %s, so just broadcast", senderUserId)
		sm.Broadcast(sessionId, event, NewSuccess(data))
		return
	}
	sm.Io.ForEach("/", RoomKey(sessionId), func(conn socketio.Conn) {
		userSocket, ok := sm.sockets[conn.ID()]
		if !ok {
			log.Warnf("Socket not found for connId %s", conn.ID())
			return
		}

		if conn.ID() != senderSocket.Conn.ID() {
			log.Debugf("[%s] multicast -> %s: %v", event, userSocket.User.Username, data)
			conn.Emit(event, NewSuccess(data))
		}
	})
}

func (sm *Manager) Unicast(userId string, event string, data interface{}) {
	userSocket, ok := sm.GetUserByUserId(userId)
	if !ok {
		return
	}
	log.Debugf("[%s] unicast to %s: %v", event, userSocket.User.Username, data)
	userSocket.Conn.Emit(event, NewSuccess(data))
}

func (sm *Manager) Join(sessionId string, userId string) {
	userSocket, ok := sm.GetUserByUserId(userId)
	if !ok {
		return
	}
	userSocket.Conn.Join(RoomKey(sessionId))
}

func (sm *Manager) Leave(sessionId string, userId string) {
	userSocket, ok := sm.GetUserByUserId(userId)
	if !ok {
		return
	}
	userSocket.Conn.Leave(RoomKey(sessionId))
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

const TypeChatMessage = "chat_message"
const TypeSystemMessage = "system_message"
const TypeAssistantRequest = "assistant_request"
const TypeAssistantResponse = "assistant_response"

type ChatMessage struct {
	SenderUserId       string  `json:"senderUserId"`
	SenderUsername     string  `json:"senderUsername"`
	SenderProfileImage *string `json:"senderProfileImage"`
	SessionId          string  `json:"sessionId"`
	Content            string  `json:"content"`
	Timestamp          int64   `json:"timestamp"`
	Type               string  `json:"type"`
}

func NewChatMessage(senderUserId string, senderUsername string, senderProfileImage *string, sessionId string, content string, timestamp int64, _type string) ChatMessage {
	return ChatMessage{
		SenderUserId:       senderUserId,
		SenderUsername:     senderUsername,
		SenderProfileImage: senderProfileImage,
		SessionId:          sessionId,
		Content:            content,
		Timestamp:          timestamp,
		Type:               _type,
	}
}

func ChatMessageFromStr(str string) (ChatMessage, error) {
	var chatMessage ChatMessage
	if err := BindJson(str, &chatMessage); err != nil {
		return ChatMessage{}, err
	}
	return chatMessage, nil
}

func (cm ChatMessage) String() (string, error) {
	bytes, err := json.Marshal(cm)
	if err != nil {
		log.Error(err)
		return "", err
	}
	return string(bytes), nil
}

type GptResponseStartEvent struct {
	GptResponseId string `json:"gpt_response_id"`
}

type GptResponseStreamEvent struct {
	GptResponseId string `json:"gpt_response_id"`
	Content       string `json:"content"`
}

type GptResponseEndEvent struct {
	GptResponseId   string `json:"gpt_response_id"`
	CompleteContent string `json:"complete_content"`
}

type GptResponseErrorEvent struct {
	GptResponseId string `json:"gpt_response_id"`
	ErrorMessage  string `json:"error_message"`
}
