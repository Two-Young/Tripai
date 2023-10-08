package controllers

import (
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/swaggo/swag/example/basic/docs"
	"os"
	controller "travel-ai/controllers/auth"
	"travel-ai/controllers/middlewares"
	controller3 "travel-ai/controllers/platform"
	"travel-ai/controllers/socket"
	controller2 "travel-ai/controllers/test"
	"travel-ai/log"
	"travel-ai/service/platform"
)

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
	r.Use(middlewares.DefaultMiddleware)
	r.GET("/ping", ping)
	docs.SwaggerInfo.Host = "localhost:10375"

	controller.UseAuthRouter(r)
	controller2.UseTestRouter(r)
	controller3.UsePlatformRouter(r)
	UseAssetRouter(r)
	socket.UseSocket(r)
	return r
}

func RunGin() {
	log.Infof("Starting server on port on %s...", platform.AppServerPort)
	r := SetupRouter()
	if err := r.Run(fmt.Sprintf(":%s", platform.AppServerPort)); err != nil {
		log.Fatal(err)
		os.Exit(-3)
	}
}
