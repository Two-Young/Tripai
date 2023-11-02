package auth

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func SignWithKakao(c *gin.Context) {
	var body SignRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		util.AbortWithErrJson(c, http.StatusBadRequest, err)
		return
	}

	credential, err := GetKakaoUserInfo(body.IdToken)
	if err != nil {
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
	id := credential.KakaoAccount.Email
	if !credential.KakaoAccount.HasEmail {
		id = strconv.FormatInt(credential.ID, 10)
	}
	result := database.DB.QueryRowx("SELECT * FROM users WHERE id = ? AND platform = ?", id, KAKAO)
	if err := result.StructScan(&userEntity); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			alreadyRegistered = false
			uid = uuid.New().String()
			userCode = platform.GenerateTenLengthCode()
			userInfo = UserInfoDto{
				UserId:       uid,
				Id:           id,
				UserCode:     userCode,
				Username:     credential.KakaoAccount.Profile.Nickname,
				ProfileImage: credential.KakaoAccount.Profile.ProfileImageURL,
				Platform:     KAKAO,
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

func UseKakaoAuthRouter(g *gin.RouterGroup) {
	sg := g.Group("/kakao")
	sg.POST("sign", SignWithKakao)
}
