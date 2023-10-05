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
			s.Close()
			return nil
		}
		user := *userEntity

		s.SetContext(user)
		log.Infof("Socket connected: [%v] %v", *user.Username, s.ID())
		SocketManager.AddUser(user, s)

		// get all chatrooms that user is in
		chatRooms, err := database_io.GetChatRoomsByUserId(uid)
		if err != nil {
			log.Errorf("Cannot get chatrooms for user %s", uid)
			log.Error(err)
			return err
		}

		for _, chatRoom := range chatRooms {
			s.Join(RoomKey(chatRoom.ChatroomId))
		}
		return nil
	})

	io.OnError("/", func(s socketio.Conn, e error) {
		user := s.Context().(database.UserEntity)
		log.Warnf("Socket error: [%v] %v", user.Username, e)
	})

	io.OnDisconnect("/", func(s socketio.Conn, reason string) {
		user := s.Context().(database.UserEntity)
		log.Debugf("Socket disconnected: [%v] %v", user.Username, reason)
		SocketManager.RemoveUserByConnId(s.ID())

		// leave all chatrooms
		s.LeaveAll()
	})

	io.OnEvent("/", "test", func(s socketio.Conn, msg string) {
		log.Debugf("ping: %v", msg)
		s.Emit("test", "pong")
	})

	io.OnEvent("/chat", "/getChatRooms", func(s socketio.Conn) {
		user := s.Context().(database.UserEntity)
		chatRooms, err := database_io.GetChatRoomsByUserId(user.UserId)
		if err != nil {
			log.Errorf("Cannot get chatrooms for user %s", user.UserId)
			log.Error(err)
			s.Emit("chatRooms", NewFailure(err.Error()))
			return
		}
		s.Emit("chatRooms", NewSuccess(chatRooms))
	})

	// get all messages in chat room (TODO :: maybe need pagination)
	io.OnEvent("/chat", "/getMessages", func(s socketio.Conn, chatRoomId string) {
		messagesRaw, err := database.InMemoryDB.LRange(RoomKey(chatRoomId), 0, -1)
		if err != nil {
			log.Errorf("Cannot get messages in chatroom %s", chatRoomId)
			log.Error(err)
			s.Emit("messages", NewFailure(err.Error()))
			return
		} else {
			s.Emit("messages", NewFailure("Cannot get messages in chatroom"))
		}

		messages := make([]ChatMessage, len(messagesRaw))
		for i, messageRaw := range messagesRaw {
			messages[i], err = ChatMessageFromStr(messageRaw)
			if err != nil {
				log.Errorf("Cannot parse message %s", messageRaw)
				log.Error(err)
				s.Emit("messages", NewFailure("Cannot parse messages in chatroom"))
				return
			}
		}

		// sort messages by timestamp (newest first - descending)
		sort.Slice(messages, func(i, j int) bool {
			return messages[i].Timestamp > messages[j].Timestamp
		})
		s.Emit("messages", NewSuccess(messages))
	})

	io.OnEvent("/chat", "/sendMessage", func(s socketio.Conn, chatRoomId string, message string) {
		user := s.Context().(database.UserEntity)
		err := database.InMemoryDB.LPushExp(RoomKey(chatRoomId), message, time.Hour*24*7)
		if err != nil {
			log.Errorf("Cannot push message to chatroom %s", chatRoomId)
			log.Error(err)
			return
		} else {
			chatMessage := NewChatMessage(
				user.UserId,
				user.Username,
				user.ProfileImage,
				message,
				time.Now().UnixMilli(),
			)
			io.BroadcastToRoom("/chat", chatRoomId, "message", NewSuccess(chatMessage))
		}
	})
}
