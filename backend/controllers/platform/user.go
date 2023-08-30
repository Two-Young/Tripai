package platform

import (
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/service/platform"
	"travel-ai/service/platform/database_io"
	"travel-ai/util"
)

func GetUserProfile(c *gin.Context) {
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// get user entity
	userEntity, err := database_io.GetUser(uid)
	if err != nil || userEntity == nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	resp := userGetProfileResponseDto{
		Username:            *userEntity.Username,
		AllowNicknameSearch: userEntity.AllowNicknameSearch,
		ProfileImage:        *userEntity.ProfileImage,
	}

	c.JSON(http.StatusOK, resp)
}

func EditUserProfile(c *gin.Context) {
	uid, err := util2.GetUid(c)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	formUsername := c.PostForm("username")
	formAllowNicknameSearch := c.PostForm("allow_nickname_search")

	if formUsername == "" || formAllowNicknameSearch == "" {
		log.Error("username or allow_nickname_search not found on form")
		util2.AbortWithStrJson(c, http.StatusBadRequest, "username or allow_nickname_search not found on form")
		return
	}

	allowNicknameSearch, err := strconv.ParseBool(formAllowNicknameSearch)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid allow_nickname_search")
		return
	}

	file, _ := c.FormFile("profile_image")
	if file == nil {
		log.Error("profile_image not found on form")
		util2.AbortWithStrJson(c, http.StatusBadRequest, "profile_image not found on form")
		return
	}

	//fileuuid := uuid.New().String()
	//filename := file.Filename
	//extension := filepath.Ext(filename)

	dest := filepath.Join(util.GetRootDirectory(), "files", "users", uid, "profile_image")
	profileImageUrl := fmt.Sprintf("http://%s:%s/asset/profile-image?user_id=%s",
		platform.AppServerHost, platform.AppServerPort, uid)

	// check profile image already exists
	if _, err := os.Stat(dest); !errors.Is(err, os.ErrNotExist) {
		if err := os.Remove(dest); err != nil {
			log.Error(err)
			util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
			return
		}
	}

	if err := c.SaveUploadedFile(file, dest); err != nil {
		log.Error(err)
		util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	// get user entity
	userEntity, err := database_io.GetUser(uid)
	if err != nil || userEntity == nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// update user entity
	userEntity.Username = &formUsername
	userEntity.AllowNicknameSearch = allowNicknameSearch
	userEntity.ProfileImage = &profileImageUrl

	tx, err := database.DB.BeginTx(c, nil)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err := database_io.UpdateUserTx(tx, *userEntity); err != nil {
		log.Error(err)
		_ = tx.Rollback()
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.Status(http.StatusOK)
}

func UseUserRouter(g *gin.RouterGroup) {
	rg := g.Group("/user")
	rg.GET("/profile", GetUserProfile)
	rg.POST("/profile", EditUserProfile)
}
