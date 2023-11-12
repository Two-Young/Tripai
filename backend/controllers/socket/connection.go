package socket

import (
	"bufio"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	socketio "github.com/googollee/go-socket.io"
	"github.com/googollee/go-socket.io/engineio"
	"github.com/googollee/go-socket.io/engineio/transport"
	"github.com/googollee/go-socket.io/engineio/transport/websocket"
	io2 "io"
	"os"
	"sort"
	"time"
	"travel-ai/controllers/middlewares"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"
	"travel-ai/service/platform/database_io"
	"travel-ai/third_party/open_ai/text_completion"
)

var (
	SocketManager = NewSocketManager()
)

func UseSocket(r *gin.Engine) {
	io := socketio.NewServer(&engineio.Options{
		Transports: []transport.Transport{
			//&polling.Transport{
			//	Client: &http.Client{
			//		Timeout: time.Minute,
			//	},
			//},
			&websocket.Transport{},
		},
	})
	SocketManager.Io = io
	userHandlers(io)

	go func() {
		err := io.Serve()
		if err != nil {
			log.Error("socket.io server error: ", err)
			log.Fatal(err)
			os.Exit(1)
		}
		log.Infof("socket.io server started")
	}()

	r.Use(middlewares.AuthMiddleware)
	r.GET("/socket.io/", gin.WrapH(io))
	r.POST("/socket.io/", func(c *gin.Context) {
		io.ServeHTTP(c.Writer, c.Request)
	})
}

func userHandlers(io *socketio.Server) {
	getUsername := func(s socketio.Conn) string {
		ctx := s.Context()
		if ctx == nil {
			return "unknown"
		}
		user := ctx.(database.UserEntity)
		return user.Username
	}

	io.OnConnect("/", func(s socketio.Conn) error {
		req := s.RemoteHeader()
		uid := req.Get("uid")
		if uid == "" {
			log.Errorf("No uid in socket connection header")
			s.Close()
			return nil
		}

		userEntity, err := database_io.GetUser(uid)
		if err != nil {
			log.Errorf("Cannot find user with uid %s", uid)
			// send disconnect event with reason
			s.Emit("disconnect", "unknown user")
			_ = s.Close()
			return nil
		}
		user := *userEntity

		s.SetContext(user)
		log.Infof("Socket connected: [%v] %v", user.Username, s.ID())
		SocketManager.AddUser(user, s)

		// get all sessions
		sessions, err := database_io.GetSessionsByUid(user.UserId)
		if err != nil {
			s.Emit("disconnect", "Cannot get sessions for user "+user.UserId)
			_ = s.Close()
			return nil
		}

		for _, session := range sessions {
			s.Join(RoomKey(session.SessionId))
			log.Debugf("Socket joined room %s [%s]", RoomKey(session.SessionId), *session.Name)
		}
		return nil
	})

	io.OnError("/", func(s socketio.Conn, e error) {
		username := getUsername(s)
		log.Warnf("Socket error: [%v] %v", username, e)
	})

	io.OnDisconnect("/", func(s socketio.Conn, reason string) {
		username := getUsername(s)
		log.Debugf("Socket disconnected: [%v] %v", username, reason)
		SocketManager.RemoveUserByConnId(s.ID())

		// leave all chatrooms
		s.LeaveAll()
	})

	io.OnEvent("/", EventTest, func(s socketio.Conn, msg string) {
		s.Emit(EventTest, "test")
	})

	// get all messages in chat room (TODO :: maybe need pagination)
	io.OnEvent("/", EventSessionChatGetMessages, func(s socketio.Conn, sessionId string) {
		log.Debugf("%s (%s): [%s]", EventSessionChatGetMessages, sessionId, getUsername(s))

		messagesRaw, err := database.InMemoryDB.LRange(RoomKey(sessionId), 0, -1)
		if err != nil {
			log.Error(err)
			s.Emit(EventSessionChatGetMessages, NewFailure(err.Error()))
			return
		}

		messages := make([]ChatMessage, len(messagesRaw))
		for i, messageRaw := range messagesRaw {
			messages[i], err = ChatMessageFromStr(messageRaw)
			if err != nil {
				log.Debug(messageRaw)
				log.Error(err)
				s.Emit(EventSessionChatGetMessages, NewFailure("Cannot parse messages in chatroom"))
				return
			}
		}

		// sort messages by timestamp (oldest first - ascending)
		sort.Slice(messages, func(i, j int) bool {
			return messages[i].Timestamp < messages[j].Timestamp
		})
		s.Emit(EventSessionChatGetMessages, NewSuccess(messages))
	})

	io.OnEvent("/", EventSessionChatSendMessage, func(s socketio.Conn, sessionId string, message string) {
		log.Debugf("%s (%s): [%s] %s", EventSessionChatSendMessage, sessionId, getUsername(s), message)

		user := s.Context().(database.UserEntity)
		chatMessage := NewChatMessage(
			user.UserId,
			user.Username,
			user.ProfileImage,
			sessionId,
			message,
			time.Now().UnixMilli(),
			TypeChatMessage,
		)
		chatMessageRaw, err := chatMessage.String()
		if err != nil {
			log.Error(err)
			s.Emit(EventSessionChatMessage, NewFailure(err.Error()))
			return
		}
		if err := database.InMemoryDB.LPushExp(RoomKey(sessionId), chatMessageRaw, time.Hour*24*7); err != nil {
			log.Error(err)
			s.Emit(EventSessionChatMessage, NewFailure(err.Error()))
			return
		}
		io.BroadcastToRoom("/", RoomKey(sessionId), EventSessionChatMessage, NewSuccess(chatMessage))
	})

	io.OnEvent("/", EventSessionChatSendAssistantMessage, func(s socketio.Conn, sessionId string, message string) {
		log.Debugf("%s (%s): [%s] %s", EventSessionChatSendAssistantMessage, sessionId, getUsername(s), message)

		user := s.Context().(database.UserEntity)
		chatMessage := NewChatMessage(
			user.UserId,
			user.Username,
			user.ProfileImage,
			sessionId,
			message,
			time.Now().UnixMilli(),
			TypeAssistantRequest,
		)
		chatMessageRaw, err := chatMessage.String()
		if err != nil {
			log.Errorf("Cannot parse GPT message %s", message)
			log.Error(err)
			s.Emit(EventSessionChatSendAssistantMessage, NewFailure(err.Error()))
			return
		}
		if err := database.InMemoryDB.RPushExp(RoomKey(sessionId), chatMessageRaw, time.Hour*24*31); err != nil {
			log.Errorf("Cannot push GPT message to session %s", sessionId)
			log.Error(err)
			s.Emit(EventSessionChatSendAssistantMessage, NewFailure(err.Error()))
			return
		}
		if err := database.InMemoryDB.RPush(RoomGptKey(sessionId), chatMessageRaw); err != nil {
			log.Errorf("Cannot push GPT message to session %s", sessionId)
			log.Error(err)
			s.Emit(EventSessionChatSendAssistantMessage, NewFailure(err.Error()))
			return
		}

		// get recent gpt messages
		fetchCount := 8
		messagesRaw, err := database.InMemoryDB.LRange(RoomGptKey(sessionId), int64(-fetchCount), -1)

		// configure histories
		histories := make([]text_completion.CompletionMessage, 0)
		// push system message
		histories = append(histories, text_completion.CompletionMessage{
			Role:    text_completion.ROLE_SYSTEM,
			Content: platform.GptBrainWashPrompt,
			Name:    "System",
		})
		log.Debugf("Histories:")
		for _, messageRaw := range messagesRaw {
			chatMessage, err := ChatMessageFromStr(messageRaw)
			if err != nil {
				log.Error(err)
				continue
			}
			var role string
			if chatMessage.Type == TypeAssistantRequest {
				role = text_completion.ROLE_USER
			} else if chatMessage.Type == TypeAssistantResponse {
				role = text_completion.ROLE_ASSISTANT
			} else {
				log.Warnf("Invalid message type %s", chatMessage.Type)
				continue
			}
			histories = append(histories, text_completion.CompletionMessage{
				Role:    role,
				Content: chatMessage.Content,
				Name:    "Traveler",
			})
			log.Debugf("%s: %s\n", chatMessage.SenderUsername, chatMessage.Content)
		}

		resp, err := text_completion.RequestCompletion(text_completion.MODEL_GPT_4, histories)
		if err != nil {
			log.Error(err)
			s.Emit(EventSessionChatSendAssistantMessage, NewFailure(err.Error()))
			return
		}

		io.BroadcastToRoom("/", RoomKey(sessionId), EventSessionChatMessage, NewSuccess(chatMessage))

		// resp
		gptMessageId := uuid.New().String()
		gptResponseStartTime := time.Now().UnixMilli()
		io.BroadcastToRoom("/", RoomKey(sessionId), EventSessionChatAssistantMessageStart, NewSuccess(GptResponseStartEvent{
			GptResponseId: gptMessageId,
		}))

		go func() {
			// create stream to store gpt response
			// and send to client as segments (resp is *io.PipeReader)
			scanner := bufio.NewScanner(resp)
			scanner.Split(bufio.ScanRunes)
			storedContent := ""

			for scanner.Scan() {
				runeText := scanner.Text()
				storedContent += runeText
				io.BroadcastToRoom("/", RoomKey(sessionId), EventSessionChatAssistantMessageStream, NewSuccess(GptResponseStreamEvent{
					GptResponseId: gptMessageId,
					Content:       runeText,
				}))
			}

			if err := scanner.Err(); err != nil {
				log.Error(err)
				if err != io2.EOF {
					log.Error(err)
					io.BroadcastToRoom("/", RoomKey(sessionId), EventSessionChatAssistantMessageError, NewSuccess(GptResponseErrorEvent{
						GptResponseId: gptMessageId,
						ErrorMessage:  err.Error(),
					}))
				}
			} else {
				// first save response to memory db
				gptResponse := ChatMessage{
					SenderUserId:       "",
					SenderUsername:     "",
					SenderProfileImage: nil,
					Content:            storedContent,
					Timestamp:          gptResponseStartTime,
					Type:               TypeAssistantResponse,
				}
				gptResponseRaw, err := gptResponse.String()
				if err != nil {
					log.Errorf("Cannot parse GPT message %s", storedContent)
					log.Error(err)
					s.Emit(EventSessionChatSendAssistantMessage, NewFailure(err.Error()))
					return
				}

				if err := database.InMemoryDB.RPushExp(RoomKey(sessionId), gptResponseRaw, time.Hour*24*31); err != nil {
					log.Errorf("Cannot push GPT message to session %s", sessionId)
					log.Error(err)
					s.Emit(EventSessionChatSendAssistantMessage, NewFailure(err.Error()))
					return
				}
				log.Debugf("GPT response saved to memory db to room %s", RoomKey(sessionId))
				if err := database.InMemoryDB.RPush(RoomGptKey(sessionId), gptResponseRaw); err != nil {
					log.Errorf("Cannot push GPT message to session %s", sessionId)
					log.Error(err)
					s.Emit(EventSessionChatSendAssistantMessage, NewFailure(err.Error()))
					return
				}
				log.Debugf("GPT response saved to memory db to gptroom %s", RoomGptKey(sessionId))
				io.BroadcastToRoom("/", RoomKey(sessionId), EventSessionChatAssistantMessageEnd, NewSuccess(GptResponseEndEvent{
					GptResponseId:   gptMessageId,
					CompleteContent: storedContent,
				}))
			}
		}()
	})
}
