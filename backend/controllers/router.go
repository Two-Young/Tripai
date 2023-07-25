package controllers

import (
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/swaggo/swag/example/basic/docs"
	"os"
	controller "travel-ai/controllers/auth"
	"travel-ai/controllers/middlewares"
	controller3 "travel-ai/controllers/platform"
	controller2 "travel-ai/controllers/test"
	"travel-ai/log"
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
	r.GET("/swagger/:any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	docs.SwaggerInfo.Host = "localhost:10375"

	controller.UseAuthRouter(r)
	controller2.UseTestRouter(r)
	controller3.UsePlatformRouter(r)
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
