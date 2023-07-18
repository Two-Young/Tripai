package crypto

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"os"
)

var (
	JwtSecretKey = ""
)

func Initialize() {
	JwtSecretKey = os.Getenv("JWT_ACCESS_SECRET")
}

func generateJWTSecretKey(length int) string {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		panic(err)
	}
	return base64.URLEncoding.EncodeToString(bytes)
}

func PrintNewJwtSecret() {
	key := generateJWTSecretKey(32)
	fmt.Println(key)
}
