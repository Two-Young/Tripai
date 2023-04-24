package controllers

type LoginRequestDto struct {
	AuthId            string `json:"auth_id" binding:"required"`
	EncryptedPassword string `json:"encrypted_password" binding:"required"`
}

type SignupRequestDto struct {
	Username string `json:"username"`
	AuthId   string `json:"auth_id" binding:"required"`
	// should be double-encrypted from raw password
	EncryptedPassword string `json:"encrypted_password" binding:"required"`
}

type SignupWithGoogleAuthRequestDto struct {
	SignupRequestDto
	GoogleAuthId          string `json:"google_auth_id" binding:"required"`
	GoogleEmail           string `json:"google_email" binding:"required"`
	GoogleProfileImageUrl string `json:"google_profile_image_url" binding:"required"`
}

// GoogleTokenInfo usually used when server checks access token for google
type GoogleTokenInfo struct {
	UserId string `json:"user_id"`
	Email  string `json:"email"`
}
