package auth

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func SignWithFacebook(c *gin.Context) {
	var body SignRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		util.AbortWithErrJson(c, http.StatusBadRequest, err)
		return
	}

	// check if access token is valid
	verifyUrl := fmt.Sprintf("https://graph.facebook.com/debug_token?input_token=%s&access_token=%s", body.IdToken)
	resp, err := http.Get(verifyUrl)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	bodyContent, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// convert body to FacebookCredentials
	var facebookCredential FacebookCredentialsDto
	if err := json.Unmarshal(bodyContent, &facebookCredential); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if !facebookCredential.Data.IsValid {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	log.Debugf("facebook credential: %v", facebookCredential)

	// Get user's information using Facebook Graph API
	userInfoUrl := fmt.Sprintf("https://graph.facebook.com/me&fields=id,name,email,picture")
	respUserInfo, err := http.Get(userInfoUrl)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	defer respUserInfo.Body.Close()

	bodyUserInfo, err := io.ReadAll(respUserInfo.Body)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	var facebookUser FacebookUser // Facebook 사용자 정보 형식에 맞게 구조체를 정의해야 합니다.
	if err := json.Unmarshal(bodyUserInfo, &facebookUser); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// register user
	// check if user already registered in database with auth
	alreadyRegistered := true
	var (
		userEntity database.UserEntity
		userCode   string
		uid        string
		returnCode int
		userInfo   UserInfoDto
	)
	result := database.DB.QueryRowx("SELECT * FROM users WHERE id = ? AND platform = ?", facebookUser.Email, GOOGLE)
	if err := result.StructScan(&userEntity); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			alreadyRegistered = false
			uid = uuid.New().String()
			userCode = platform.GenerateTenLengthCode()
			userInfo = UserInfoDto{
				UserId:       uid,
				Id:           facebookUser.Email,
				UserCode:     userCode,
				Username:     facebookUser.Name,
				ProfileImage: facebookUser.Picture.Data.URL,
				Platform:     FACEBOOK,
			}
		} else {
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	} else {
		uid = userEntity.UserId
		userInfo = UserInfoDto{
			UserId:       userEntity.UserId,
			Id:           *userEntity.Id,
			UserCode:     userEntity.UserCode,
			Username:     userEntity.Username,
			ProfileImage: *userEntity.ProfileImage,
			Platform:     *userEntity.Platform,
		}
	}

	if !alreadyRegistered {
		// create user
		if err := database.DB.QueryRowx("INSERT INTO users(uid, id, user_code, username, profile_image, platform) VALUES(?, ?, ?, ?, ?, ?)",
			userInfo.UserId, userInfo.Id, userInfo.UserCode, userInfo.Username, userInfo.ProfileImage, userInfo.Platform).Err(); err != nil {
			log.Error(err)
			util.AbortWithStrJson(c, http.StatusInternalServerError, "failed to create user")
			return
		}
		returnCode = http.StatusCreated
	} else {
		returnCode = http.StatusOK
	}

	// create access, refresh token
	authTokenBundle, err := CreateAuthToken(uid)
	if err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusInternalServerError, "failed to create access token")
	}

	// save refresh token to in-memory
	if err := saveRefreshToken(uid, authTokenBundle.RefreshToken); err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusInternalServerError, "failed to save refresh token")
	}

	signResponseDto := SignResponseDto{
		AuthTokens: *authTokenBundle,
		UserInfo:   userInfo,
	}

	c.JSON(returnCode, signResponseDto)
}

func UseFacebookAuthRouter(g *gin.RouterGroup) {
	sg := g.Group("/facebook")
	sg.POST("sign", SignWithFacebook)
}
