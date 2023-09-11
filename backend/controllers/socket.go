package controllers

import (
	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"
	"github.com/googollee/go-socket.io/engineio"
	"github.com/googollee/go-socket.io/engineio/transport"
	"github.com/googollee/go-socket.io/engineio/transport/websocket"
	"os"
	"travel-ai/log"
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

	r.GET("/socket.io/", gin.WrapH(io))
	r.POST("/socket.io/", func(c *gin.Context) {
		io.ServeHTTP(c.Writer, c.Request)
	})
}

func userHandlers(io *socketio.Server) {
	io.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		log.Infof("connected: %v", s.ID())
		return nil
	})

	io.OnError("/", func(s socketio.Conn, e error) {
		log.Warnf("meet error: %v", e)
	})

	io.OnDisconnect("/", func(s socketio.Conn, reason string) {
		log.Debugf("closed: %v", reason)
	})

	io.OnEvent("/", "test", func(s socketio.Conn, msg string) {
		log.Debugf("ping: %v", msg)
		s.Emit("reply", "pong")
	})
}
