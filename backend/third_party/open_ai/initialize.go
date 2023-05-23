package open_ai

import "os"

var openAiApiKey string

func Initialize() {
	// get api key from env
	openAiApiKey = os.Getenv("OPEN_AI_API_KEY")
}

func GetOpenAiApiKey() string {
	return openAiApiKey
}
