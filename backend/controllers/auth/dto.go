package auth

type authToken struct {
	Token     string `json:"token"`
	ExpiresAt int64  `json:"expires_at"`
}

type AuthTokenBundle struct {
	AccessToken  authToken `json:"access_token"`
	RefreshToken authToken `json:"refresh_token"`
}

type SignRequestDto struct {
	IdToken string `json:"id_token" binding:"required"`
}

type UserInfoDto struct {
	UserId              string `json:"user_id"`
	Id                  string `json:"id"`
	UserCode            string `json:"user_code"`
	Username            string `json:"username"`
	ProfileImage        string `json:"profile_image"`
	Platform            string `json:"platform"`
	AllowNicknameSearch bool   `json:"allow_nickname_search"`
}

type SignResponseDto struct {
	AuthTokens AuthTokenBundle `json:"auth_tokens"`
	UserInfo   UserInfoDto     `json:"user_info"`
}

type GoogleCredentialsDto struct {
	Iss           string `json:"iss"`
	Azp           string `json:"azp"`
	Aud           string `json:"aud"`
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Locale        string `json:"locale"`
	Iat           string `json:"iat"`
	Exp           string `json:"exp"`
	Alg           string `json:"alg"`
	Kid           string `json:"kid"`
	Typ           string `json:"typ"`
}

type NaverCredentialsDto struct {
	ResultCode string `json:"resultcode"`
	Message    string `json:"message"`
}

type NaverProfileDto struct {
	ResultCode string `json:"resultcode"`
	Message    string `json:"message"`
	Response   struct {
		Id      string `json:"id"`
		Profile string `json:"profile_image"`
		Email   string `json:"email"`
		Name    string `json:"name"`
	}
}

type FacebookCredentialsDto struct {
	Data struct {
		AppID       string `json:"app_id"`
		Type        string `json:"type"`
		Application string `json:"application"`
		ExpiresAt   int64  `json:"expires_at"`
		IsValid     bool   `json:"is_valid"`
		UserID      string `json:"user_id"`
	} `json:"data"`
}

type FacebookUser struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Email   string `json:"email"`
	Picture struct {
		Data struct {
			Height       int    `json:"height"`
			IsSilhouette bool   `json:"is_silhouette"`
			URL          string `json:"url"`
			Width        int    `json:"width"`
		} `json:"data"`
	} `json:"picture"`
}
