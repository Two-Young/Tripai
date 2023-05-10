package auth

type authToken struct {
	Token     string `json:"token"`
	ExpiresAt int64  `json:"expires_at"`
}

type authTokenBundle struct {
	AccessToken  authToken `json:"access_token"`
	RefreshToken authToken `json:"refresh_token"`
}

type SignRequestDto struct {
	IdToken string `json:"id_token" binding:"required"`
}

type UserInfoDto struct {
	UserId       string `json:"user_id"`
	Id           string `json:"id"`
	Username     string `json:"username"`
	ProfileImage string `json:"profile_image"`
	Platform     string `json:"platform"`
}

type SignResponseDto struct {
	AuthTokens authTokenBundle `json:"auth_tokens"`
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
