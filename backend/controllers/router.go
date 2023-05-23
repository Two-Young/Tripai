package controllers

import (
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"os"
	"travel-ai/controllers/auth"
	auth2 "travel-ai/controllers/test"
	"travel-ai/log"
)

func DefaultMiddleware(c *gin.Context) {
	//log.Debug(c.Request.Method, c.Request.URL.String())
	c.Next()
}

func ping(c *gin.Context) {
	c.String(200, "pong")
}

func SetupRouter() *gin.Engine {
	gin.DefaultWriter = &log.GlobalLogger
	gin.DefaultErrorWriter = &log.GlobalLogger

	// setting cors
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"*"}

	r := gin.Default()
	r.Use(cors.New(config))
	r.Use(DefaultMiddleware)
	r.GET("/ping", ping)

	auth.UseAuthRouter(r)
	auth2.UseTestRouter(r)
	return r
}

func RunGin() {
	AppServerPort := os.Getenv("APP_SERVER_PORT")

	log.Infof("Starting server on port on %d...", AppServerPort)
	r := SetupRouter()
	if err := r.Run(fmt.Sprintf(":%s", AppServerPort)); err != nil {
		log.Fatal(err)
		os.Exit(-3)
	}
}
