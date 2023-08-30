package auth

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"io"
	"net/http"
	"travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"
)

func SignWithNaver(c *gin.Context) {
	var body SignRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// check if access token is valid
	verifyUrl := fmt.Sprintf("https://openapi.naver.com/v1/nid/verify?access_token=%s", body.IdToken)
	req, err := http.NewRequest("GET", verifyUrl, nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", body.IdToken))
	resp, err := http.DefaultClient.Do(req)
	defer resp.Body.Close()
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	bodyContent, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// convert body to GoogleCredentials
	var naverCredentials NaverCredentialsDto
	if err := json.Unmarshal(bodyContent, &naverCredentials); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if resp.StatusCode != http.StatusOK {
		util.AbortWithErrJson(c, http.StatusUnauthorized, fmt.Errorf("invalid token: status code must be 200, but %d given", resp.StatusCode))
		return
	}

	if naverCredentials.ResultCode != "00" {
		util.AbortWithErrJson(c, http.StatusUnauthorized, fmt.Errorf("invalid token: result code must be 00, but %s given", naverCredentials.ResultCode))
		return
	}

	// get profile info
	profileUrl := "https://openapi.naver.com/v1/nid/me"
	req, err = http.NewRequest("GET", profileUrl, nil)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", body.IdToken))
	resp, err = http.DefaultClient.Do(req)
	defer resp.Body.Close()

	bodyContent, err = io.ReadAll(resp.Body)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	var naverProfile NaverProfileDto
	if err := json.Unmarshal(bodyContent, &naverProfile); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// register user
	// check if user already registered in database with auth
	alreadyRegistered := true
	var (
		userEntity database.UserEntity
		uid        string
		userCode   string
		returnCode int
		userInfo   UserInfoDto
	)
	result := database.DB.QueryRowx("SELECT * FROM users WHERE id = ? AND platform = ?", naverProfile.Response.Email, NAVER)
	if err := result.StructScan(&userEntity); err != nil {
		if err == sql.ErrNoRows {
			alreadyRegistered = false
			uid = uuid.New().String()
			userCode = platform.GenerateUserCode()
			userInfo = UserInfoDto{
				UserId:       uid,
				Id:           naverProfile.Response.Email,
				UserCode:     userCode,
				Username:     naverProfile.Response.Name,
				ProfileImage: naverProfile.Response.Profile,
				Platform:     NAVER,
			}
		} else {
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	} else {
		uid = *userEntity.UserId
		userInfo = UserInfoDto{
			UserId:       *userEntity.UserId,
			Id:           *userEntity.Id,
			UserCode:     userEntity.UserCode,
			Username:     *userEntity.Username,
			ProfileImage: *userEntity.ProfileImage,
			Platform:     *userEntity.Platform,
		}
	}

	if !alreadyRegistered {
		// create user
		if err := database.DB.QueryRowx("INSERT INTO users(uid, id, user_code, username, profile_image, platform) VALUES(?, ?, ?, ?, ?)",
			userInfo.UserId, userInfo.Id, userInfo.UserCode, userInfo.Username, userInfo.ProfileImage, userInfo.Platform).Err(); err != nil {
			log.Error(err)
			util.AbortWithStrJson(c, http.StatusInternalServerError, "failed to create user")
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
		return
	}

	// save refresh token to in-memory
	if err := saveRefreshToken(uid, authTokenBundle.RefreshToken); err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusInternalServerError, "failed to save refresh token")
		return
	}

	signResponseDto := SignResponseDto{
		AuthTokens: *authTokenBundle,
		UserInfo:   userInfo,
	}

	c.JSON(returnCode, signResponseDto)
}

func UseNaverAuthRouter(g *gin.RouterGroup) {
	sg := g.Group("/naver")
	sg.POST("sign", SignWithNaver)
}
