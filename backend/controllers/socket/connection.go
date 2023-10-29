package socket

import (
	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"
	"github.com/googollee/go-socket.io/engineio"
	"github.com/googollee/go-socket.io/engineio/transport"
	"github.com/googollee/go-socket.io/engineio/transport/websocket"
	"os"
	"sort"
	"time"
	"travel-ai/controllers/middlewares"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform/database_io"
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
			log.Debugf("Socket joined room %s [%s]", RoomKey(session.SessionId), session.Name)
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

	io.OnEvent("/", "test", func(s socketio.Conn, msg string) {
		s.Emit("test", "test")
	})

	// get all messages in chat room (TODO :: maybe need pagination)
	io.OnEvent("/", "sessionChat/getMessages", func(s socketio.Conn, sessionId string) {
		log.Debugf("sessionChat/getMessages (%s): [%s]", sessionId, getUsername(s))

		messagesRaw, err := database.InMemoryDB.LRange(RoomKey(sessionId), 0, -1)
		if err != nil {
			log.Error(err)
			s.Emit("sessionChat/getMessages", NewFailure(err.Error()))
			return
		}

		messages := make([]ChatMessage, len(messagesRaw))
		for i, messageRaw := range messagesRaw {
			messages[i], err = ChatMessageFromStr(messageRaw)
			if err != nil {
				log.Debug(messageRaw)
				log.Error(err)
				s.Emit("sessionChat/getMessages", NewFailure("Cannot parse messages in chatroom"))
				return
			}
		}

		// sort messages by timestamp (oldest first - ascending)
		sort.Slice(messages, func(i, j int) bool {
			return messages[i].Timestamp < messages[j].Timestamp
		})
		s.Emit("sessionChat/getMessages", NewSuccess(messages))
	})

	io.OnEvent("/", "sessionChat/sendMessage", func(s socketio.Conn, sessionId string, message string) {
		log.Debugf("sessionChat/sendMessage (%s): [%s] %s", sessionId, getUsername(s), message)

		user := s.Context().(database.UserEntity)
		chatMessage := NewChatMessage(
			user.UserId,
			user.Username,
			user.ProfileImage,
			message,
			time.Now().UnixMilli(),
			TypeChatMessage,
		)
		chatMessageRaw, err := chatMessage.String()
		if err != nil {
			log.Error(err)
			s.Emit("sessionChat/message", NewFailure(err.Error()))
			return
		}
		if err := database.InMemoryDB.LPushExp(RoomKey(sessionId), chatMessageRaw, time.Hour*24*7); err != nil {
			log.Error(err)
			s.Emit("sessionChat/message", NewFailure(err.Error()))
			return
		}
		io.BroadcastToRoom("/", RoomKey(sessionId), "sessionChat/message", NewSuccess(chatMessage))
	})

	io.OnEvent("/", "sendAssistantMessage", func(s socketio.Conn, sessionId string, message string) {
		log.Debugf("sessionChat/sendAssistantMessage (%s): [%s] %s", sessionId, getUsername(s), message)

		user := s.Context().(database.UserEntity)
		chatMessage := NewChatMessage(
			user.UserId,
			user.Username,
			user.ProfileImage,
			message,
			time.Now().UnixMilli(),
			TypeAssistantRequest,
		)
		chatMessageRaw, err := chatMessage.String()
		if err != nil {
			log.Errorf("Cannot parse GPT message %s", message)
			log.Error(err)
			s.Emit("sessionChat/sendAssistantMessage", NewFailure(err.Error()))
			return
		}
		if err := database.InMemoryDB.LPushExp(RoomKey(sessionId), chatMessageRaw, time.Hour*24*7); err != nil {
			log.Errorf("Cannot push GPT message to session %s", sessionId)
			log.Error(err)
			s.Emit("sessionChat/sendAssistantMessage", NewFailure(err.Error()))
			return
		}
		// TODO :: send to GPT

		io.BroadcastToRoom("/", RoomKey(sessionId), "sessionChat/sendAssistantMessage", NewSuccess(chatMessage))
	})
}
