package controllers

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"io"
	"net/http"
	"os"
	"travel-ai/log"
	"travel-ai/service/database"
)

var (
	clientId,
	clientSecret,
	redirectUrl string
	config *oauth2.Config
)

type GoogleOauth2UserInfo struct {
	Email         string `json:"email"`
	Id            string `json:"id"` // google auth id
	Picture       string `json:"picture"`
	VerifiedEmail bool   `json:"verified_email"`
}

func InitializeGoogleOauth() {
	clientId = os.Getenv("GOOGLE_OAUTH2_CLIENT_ID")
	clientSecret = os.Getenv("GOOGLE_OAUTH2_CLIENT_SECRET")
	redirectUrl = os.Getenv("GOOGLE_OAUTH2_REDIRECT_URL")
	config = &oauth2.Config{
		ClientID:     clientId,
		ClientSecret: clientSecret,
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email"},
		RedirectURL:  redirectUrl,
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://accounts.google.com/o/oauth2/auth",
			TokenURL: "https://accounts.google.com/o/oauth2/token",
		},
	}

	if clientId == "" || clientSecret == "" || redirectUrl == "" {
		panic("Missing environment variables for Google OAuth2 configuration")
	}
}

func SignupWithGoogleAuth(c *gin.Context) {
	var body SignupWithGoogleAuthRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// check if user already registered in database with Google auth
	var userEntity database.UserEntity
	result := database.DB.QueryRowx("SELECT * FROM user_master WHERE auth_id = ? OR google_auth_id = ?", body.AuthId, body.GoogleAuthId)
	err := result.StructScan(&userEntity)
	if err != nil {
		if err == sql.ErrNoRows {
			// create user
			// case: user that Google login as first
			uid := uuid.New().String()
			_, err = database.DB.Exec(
				"INSERT INTO user_master (uid, username, auth_id, auth_encrypted_pw, google_auth_id, google_email, google_profile_image_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
				uid, body.Username, body.AuthId, body.EncryptedPassword, body.GoogleAuthId, body.GoogleEmail, body.GoogleProfileImageUrl,
			)
			if err != nil {
				log.Error(err)
				c.AbortWithStatus(http.StatusInternalServerError)
				return
			}
		} else {
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	} else {
		// user found with Google auth
		// check if user already registered in database with email
		if userEntity.AuthId != nil && userEntity.GoogleAuthId != nil {
			// already bind with auth and Google auth
			// case: user already bind with Google auth
			c.AbortWithStatus(http.StatusConflict)
			return
		} else if userEntity.AuthId != nil {
			// case: user is binding Google auth with auth
			// update user with Google auth
			_, err = database.DB.Exec("UPDATE user_master SET google_auth_id = ?, google_email = ?, google_profile_image_url = ? WHERE auth_id = ?", body.GoogleAuthId, body.GoogleEmail, body.GoogleProfileImageUrl, body.AuthId)
		} else {
			// case: just google auth exists or no auth exists
			// this is fatal error
			log.Error("Fatal error: user found with Google auth but no auth")
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
	}

	// rescan user
	result = database.DB.QueryRowx("SELECT * FROM user_master WHERE auth_id = ? OR google_auth_id = ? LIMIT 1", body.AuthId, body.GoogleAuthId)
	err = result.StructScan(&userEntity)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(http.StatusOK, userEntity)
}

func GoogleOauth2Login(c *gin.Context) {
	// create random token to prevent CSRF
	stateToken := createGoogleOauthState()

	// save token to session
	c.SetCookie("oauthstate", stateToken, 0, "/", "", false, true)
	c.Header("Cache-Control", "no-cache, no-store, must-revalidate") // Set Cache-Control header
	url := config.AuthCodeURL(stateToken, oauth2.AccessTypeOffline)

	// redirect to Google's consent page to ask for permission
	c.Redirect(http.StatusMovedPermanently, url)
}

func GoogleOauth2Callback(c *gin.Context) {
	stateToken, err := c.Cookie("oauthstate")
	if err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	if c.Query("state") != stateToken {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	token, err := config.Exchange(context.Background(), c.Query("code"))
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	response, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	defer response.Body.Close()
	contents, err := io.ReadAll(response.Body)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	var googleOauthUserInfo GoogleOauth2UserInfo
	err = json.Unmarshal(contents, &googleOauthUserInfo)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// create user if not exist
	var googleAuthResult googleAuthResultDto

	googleAuthResult.GoogleUserInfo = &googleOauthUserInfo
	googleAuthResult.Auth = NewAuthTokenDto(
		*NewAuthToken(token.AccessToken, uuid.New().String(), token.Expiry.Unix()),
		*NewAuthToken(token.RefreshToken, uuid.New().String(), token.Expiry.Unix()),
	)

	// Send a message to the client's window object
	marshaled, err := json.Marshal(googleAuthResult)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	log.Debug("googleAuthResult:", googleAuthResult)

	script := fmt.Sprintf(`<script>
		try {
			const data = JSON.parse('%s');
			window.opener.postMessage({type: "google_oauth_callback_result", data, success: true}, '*');
		} catch (e) {
			window.opener.postMessage({type: "google_oauth_callback_result", data, success: false}, '*');
		} finally {
			window.close();
		}
	</script>`, marshaled)
	c.Data(http.StatusOK, "text/html", []byte(script))
}

func createGoogleOauthState() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return ""
	}
	return base64.URLEncoding.EncodeToString(b)
}

func UseGoogleAuthRouter(g *gin.RouterGroup) {
	sg := g.Group("/google_auth")
	sg.POST("signup", SignupWithGoogleAuth)
	sg.GET("login", GoogleOauth2Login)
	sg.GET("login_callback", GoogleOauth2Callback)
}
