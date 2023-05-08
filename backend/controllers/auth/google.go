package auth

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"net/http"
	"os"
	"travel-ai/log"
)

var (
	clientId,
	clientSecret,
	redirectUrl string
	config *oauth2.Config
)

type SignRequestDto struct {
	IdToken string `json:"id_token" binding:"required"`
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

func Sign(c *gin.Context) {
	var body SignRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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

	if resp.StatusCode != http.StatusOK {
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ok"})
}

func UseGoogleAuthRouter(g *gin.RouterGroup) {
	sg := g.Group("/google")
	sg.POST("sign", Sign)
}
