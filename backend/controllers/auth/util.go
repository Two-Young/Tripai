package auth

import (
	"github.com/golang-jwt/jwt"
	"os"
	"time"
	"travel-ai/service/database"
	"travel-ai/util"
)

const (
	INTERNAL  = "INTERNAL"
	GOOGLE    = "GOOGLE"
	NAVER     = "NAVER"
	INSTAGRAM = "INSTAGRAM"
	FACEBOOK  = "FACEBOOK"
)

func createAuthToken(uid string) (*authTokenBundle, error) {
	var err error
	atd := &authTokenBundle{}

	// load jwt secret from env
	jwtAccessSecretKey := os.Getenv("JWT_ACCESS_SECRET")
	jwtRefreshSecretKey := os.Getenv("JWT_REFRESH_SECRET")
	jwtAccessExpireTimeRaw := os.Getenv("JWT_ACCESS_EXPIRE")
	jwtRefreshExpireTimeRaw := os.Getenv("JWT_REFRESH_EXPIRE")

	jwtAccessExpireTime, err := util.ParseDuration(jwtAccessExpireTimeRaw)
	if err != nil {
		return nil, err
	}
	jwtRefreshExpireTime, err := util.ParseDuration(jwtRefreshExpireTimeRaw)
	if err != nil {
		return nil, err
	}

	// set access token
	atd.AccessToken.ExpiresAt = time.Now().Add(jwtAccessExpireTime).Unix() // 3 hours expiration
	accessTokenClaims := jwt.MapClaims{}
	accessTokenClaims["uid"] = uid
	accessTokenClaims["exp"] = atd.AccessToken.ExpiresAt
	accessTokenClaims["authorized"] = true
	signedAccessClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, accessTokenClaims)
	atd.AccessToken.Token, err = signedAccessClaims.SignedString([]byte(jwtAccessSecretKey))
	if err != nil {
		return nil, err
	}

	// set refresh token
	atd.RefreshToken.ExpiresAt = time.Now().Add(jwtRefreshExpireTime).Unix() // 7 days expiration
	refreshTokenClaims := jwt.MapClaims{}
	refreshTokenClaims["uid"] = uid
	refreshTokenClaims["exp"] = atd.RefreshToken.ExpiresAt
	signedRefreshClaims := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshTokenClaims)
	atd.RefreshToken.Token, err = signedRefreshClaims.SignedString([]byte(jwtRefreshSecretKey))
	if err != nil {
		return nil, err
	}

	return atd, nil
}

func saveRefreshToken(uid string, refreshToken authToken) error {
	refreshTokenExpiresUnix := time.Unix(refreshToken.ExpiresAt, 0)
	now := time.Now()

	if err := database.InMemoryDB.SetExp(refreshToken.Token, uid, refreshTokenExpiresUnix.Sub(now)); err != nil {
		return err
	}
	return nil
}
