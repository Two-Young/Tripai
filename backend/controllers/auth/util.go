package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt"
	"io"
	"net/http"
	"os"
	"time"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/util"
)

const (
	INTERNAL  = "INTERNAL"
	GOOGLE    = "GOOGLE"
	NAVER     = "NAVER"
	INSTAGRAM = "INSTAGRAM"
	FACEBOOK  = "FACEBOOK"
	KAKAO     = "KAKAO"
)

func CreateAuthToken(uid string) (*AuthTokenBundle, error) {
	var err error
	atd := &AuthTokenBundle{}

	if uid == "" {
		return nil, errors.New("uid empty")
	}

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

func GetFacebookUserInfo(accessToken string) (*FacebookUser, error) {
	url := "https://graph.facebook.com/v11.0/me?fields=id,name,email,picture&access_token=" + accessToken

	resp, err := http.Get(url)
	if err != nil {
		log.Error(err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error getting user info, HTTP status: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error(err)
		return nil, err
	}

	log.Debugf("facebook user info: %s", string(body))

	var userInfo FacebookUser
	err = json.Unmarshal(body, &userInfo)
	if err != nil {
		log.Error(err)
		return nil, err
	}

	return &userInfo, nil
}

func GetKakaoUserInfo(accessToken string) (*KakaoUser, error) {
	url := "https://kapi.kakao.com/v2/user/me"

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Error(err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Error getting user info. HTTP status: %s", resp.Status)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error(err)
		return nil, err
	}

	var userInfo KakaoUser
	err = json.Unmarshal(body, &userInfo)
	if err != nil {
		log.Error(err)
		return nil, err
	}

	return &userInfo, nil
}
