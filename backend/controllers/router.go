package controllers

import (
	"errors"
	"fmt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"github.com/swaggo/swag/example/basic/docs"
	"net/http"
	"os"
	controller "travel-ai/controllers/auth"
	controller3 "travel-ai/controllers/platform"
	controller2 "travel-ai/controllers/test"
	"travel-ai/log"
	"travel-ai/service/platform"
)

func DefaultMiddleware(c *gin.Context) {
	//log.Debug(c.Request.Method, c.Request.URL.String())
	c.Next()
}

func AuthMiddleware(c *gin.Context) {
	rawToken, err := platform.ExtractAuthToken(c.Request)
	if err != nil {
		c.AbortWithError(http.StatusUnauthorized, err)
		return
	}

	userId, errorMap := platform.DissolveAuthToken(rawToken)
	if errorMap != nil {
		log.Warn(errorMap)
		c.AbortWithError(http.StatusUnauthorized, errors.New("all auth-dissolve methods failed"))
		return
	}

	c.Set("uid", userId)
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
