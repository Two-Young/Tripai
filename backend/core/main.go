package main

import (
	"fmt"
	"math/rand"
	"os"
	"strings"
	"time"
	"travel-ai/controllers"
	platform2 "travel-ai/controllers/platform"
	"travel-ai/libs/crypto"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"
	"travel-ai/third_party/google_cloud/cloud_vision"
	"travel-ai/third_party/google_cloud/places"
	"travel-ai/third_party/open_ai"
	"travel-ai/third_party/pexels"
	"travel-ai/third_party/taggun_receipt_ocr"

	"github.com/joho/godotenv"
)

func main() {
	fmt.Println(`
	████████╗██████╗ ██╗██████╗  █████╗ ██╗
	╚══██╔══╝██╔══██╗██║██╔══██╗██╔══██╗██║
	   ██║   ██████╔╝██║██████╔╝███████║██║
	   ██║   ██╔══██╗██║██╔═══╝ ██╔══██║██║
	   ██║   ██║  ██║██║██║     ██║  ██║██║
	   ╚═╝   ╚═╝  ╚═╝╚═╝╚═╝     ╚═╝  ╚═╝╚═╝
	`)
	log.Info("Tripet Server is now starting...")
	log.Info("Version: ", platform2.VERSION)

	// Create Jwt secret key if needed
	crypto.PrintNewJwtSecret()

	// Load environment variables
	log.Info("Initializing environments...")
	if err := godotenv.Load(); err != nil {
		log.Error(err)
		os.Exit(-1)
	}

	// Check environment variables
	var envCheckKeys = []string{
		"APP_SERVER_PORT",
		"OPEN_AI_API_KEY",
		"DB_USER",
		"DB_PASSWORD",
		"DB_HOST",
		"DB_PORT",
		"DB_NAME",
		"JWT_ACCESS_SECRET",
		"JWT_ACCESS_EXPIRE",
		"JWT_REFRESH_SECRET",
		"JWT_REFRESH_EXPIRE",
		"DEBUG",
	}
	missingVariables := make([]string, 0)
	for _, key := range envCheckKeys {
		if os.Getenv(key) == "" {
			missingVariables = append(missingVariables, key)
		}
	}

	if len(missingVariables) > 0 {
		missingVarKeys := strings.Join(missingVariables, ", ")
		log.Error("Missing environment variables: ", missingVarKeys)
		os.Exit(-1)
	}

	if platform.IsDebugMode() {
		log.Debug("Running in debug mode...")
	} else {
		log.Info("Running in production mode...")
	}

	// Initialize database
	log.Info("Initializing database...")
	if _, err := database.Initialize(); err != nil {
		log.Error(err)
		os.Exit(-2)
	}

	// Initialize in-memory database
	log.Info("Initializing in-memory database...")
	database.InMemoryDB = database.NewRedis()

	// Initialize third party libraries
	crypto.Initialize()
	open_ai.Initialize()
	cloud_vision.Initialize()
	places.Initialize()
	pexels.Initialize()
	taggun_receipt_ocr.Initialize()

	// Preload
	if err := platform.Preload(); err != nil {
		log.Error(err)
		os.Exit(-3)
	}

	// randomize seed
	rand.Seed(time.Now().UnixNano())

	// Run web server with gin
	controllers.RunGin()
}
