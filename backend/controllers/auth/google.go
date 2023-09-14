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

// SignWithGoogle godoc
// @Router /auth/google/sign [post]
// @Name SignWithGoogle
func SignWithGoogle(c *gin.Context) {
	var body SignRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		util.AbortWithErrJson(c, http.StatusBadRequest, err)
		return
	}

	// check if id token is valid
	verifyUrl := fmt.Sprintf("https://oauth2.googleapis.com/tokeninfo?id_token=%s", body.IdToken)
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

	// convert body to GoogleCredentials
	var googleCredentials GoogleCredentialsDto
	if err := json.Unmarshal(bodyContent, &googleCredentials); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if resp.StatusCode != http.StatusOK {
		c.AbortWithStatus(http.StatusUnauthorized)
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
	result := database.DB.QueryRowx("SELECT * FROM users WHERE id = ? AND platform = ?", googleCredentials.Email, GOOGLE)
	if err := result.StructScan(&userEntity); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			alreadyRegistered = false
			uid = uuid.New().String()
			userCode = platform.GenerateTenLengthCode()
			userInfo = UserInfoDto{
				UserId:       uid,
				Id:           googleCredentials.Email,
				UserCode:     userCode,
				Username:     googleCredentials.Name,
				ProfileImage: googleCredentials.Picture,
				Platform:     GOOGLE,
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
			Username:     *userEntity.Username,
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

func UseGoogleAuthRouter(g *gin.RouterGroup) {
	sg := g.Group("/google")
	sg.POST("sign", SignWithGoogle)
}
