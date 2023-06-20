package main

import (
	"github.com/joho/godotenv"
	"os"
	"strings"
	"travel-ai/controllers"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/third_party/google_cloud/cloud_vision"
	"travel-ai/third_party/open_ai"
)

func main() {
	log.Info("Travel AI Server is now starting...")

	// Create Jwt secret key if needed
	//crypto.PrintNewJwtSecret()

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
	open_ai.Initialize()
	cloud_vision.Initialize()

	// Run web server with gin
	controllers.RunGin()
}
