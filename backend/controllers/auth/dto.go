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

type GoogleUser struct {
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

type KakaoUser struct {
	ID          int64  `json:"id"`
	ConnectedAt string `json:"connected_at"`
	Properties  struct {
		Nickname       string `json:"nickname"`
		ProfileImage   string `json:"profile_image"`
		ThumbnailImage string `json:"thumbnail_image"`
	} `json:"properties"`
	KakaoAccount struct {
		ProfileNicknameNeedsAgreement bool `json:"profile_nickname_needs_agreement"`
		ProfileImageNeedsAgreement    bool `json:"profile_image_needs_agreement"`
		Profile                       struct {
			Nickname          string `json:"nickname"`
			ThumbnailImageURL string `json:"thumbnail_image_url"`
			ProfileImageURL   string `json:"profile_image_url"`
			IsDefaultImage    bool   `json:"is_default_image"`
		} `json:"profile"`
		HasEmail        bool   `json:"has_email"`
		IsEmailValid    bool   `json:"is_email_valid"`
		IsEmailVerified bool   `json:"is_email_verified"`
		Email           string `json:"email"`
	} `json:"kakao_account"`
}
