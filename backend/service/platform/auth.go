package platform

import (
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt"
	"net/http"
	"strings"
	"travel-ai/libs/crypto"
)

type TokenDissolveFunc func(rawToken string) (string, error)

var (
	TokenDissolvers = map[string]TokenDissolveFunc{
		"Platform": dissolveWithPlatformToken,
	}
)

func DissolveAuthToken(rawToken string) (string, map[string]string) {
	errMap := make(map[string]string)
	for method, f := range TokenDissolvers {
		uid, err := f(rawToken)
		if err == nil {
			return uid, nil
		}
		errMap[method] = err.Error()
	}
	return "", errMap
}

func dissolveWithPlatformToken(rawToken string) (string, error) {
	// check if token is valid
	token, err := jwt.Parse(rawToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(crypto.JwtSecretKey), nil
	})
	if err != nil {
		return "", err
	}

	// check if token is expired
	cliams, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		// token expired
		return "", errors.New("token expired or invalid")
	}

	userId := cliams["uid"].(string)
	return userId, nil
}

func ExtractAuthToken(req *http.Request) (string, error) {
	bearer := req.Header.Get("Authorization")
	token := strings.Split(bearer, " ")
	if len(token) != 2 {
		return "", fmt.Errorf("invalid token: \"%s\"", bearer)
	}
	authToken := token[1]
	if len(authToken) == 0 {
		return "", errors.New("token empty")
	}
	return authToken, nil
}
