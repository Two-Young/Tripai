package controllers

import (
	"errors"
	"travel-ai/service/database"
)

type userDto struct {
	UserId                string  `json:"uid"`
	Username              *string `json:"username"`
	AuthId                *string `json:"auth_id"`
	ProfileImageUrl       *string `json:"profile_image_url"`
	GoogleAuthId          *string `json:"google_auth_id"`
	GoogleEmail           *string `json:"google_email"`
	GoogleProfileImageUrl *string `json:"google_profile_image_url"`
}

func NewUserDto(userId string, username, authId, profileImageUrl, googleAuthId, googleEmail, googleProfileImageUrl *string) *userDto {
	return &userDto{
		UserId:                userId,
		AuthId:                authId,
		Username:              username,
		ProfileImageUrl:       profileImageUrl,
		GoogleAuthId:          googleAuthId,
		GoogleEmail:           googleEmail,
		GoogleProfileImageUrl: googleProfileImageUrl,
	}
}

func UserDtoFromEntity(entity database.UserEntity) *userDto {
	return &userDto{
		UserId:                *entity.UserId,
		AuthId:                entity.AuthId,
		Username:              entity.Username,
		ProfileImageUrl:       entity.AuthProfileImageUrl,
		GoogleAuthId:          entity.GoogleAuthId,
		GoogleEmail:           entity.GoogleEmail,
		GoogleProfileImageUrl: entity.GoogleProfileImageUrl,
	}
}

func (u userDto) validate() error {
	if u.UserId == "" {
		return errors.New("uid is empty")
	}
	if (u.AuthId == nil || u.Username == nil) && (u.GoogleAuthId == nil || u.GoogleEmail == nil) {
		return errors.New("auth_id and username or google_auth_id and google_email are empty")
	}
	return nil
}

type authToken struct {
	Token     string `json:"token"`
	Uuid      string `json:"uuid"`
	ExpiresAt int64  `json:"expires_at"`
}

func NewAuthToken(token, uuid string, expiresAt int64) *authToken {
	return &authToken{
		Token:     token,
		Uuid:      uuid,
		ExpiresAt: expiresAt,
	}
}

type authTokenDto struct {
	AccessToken  authToken `json:"access_token"`
	RefreshToken authToken `json:"refresh_token"`
	isGoogleAuth bool
}

func NewAuthTokenDto(accessToken, refreshToken authToken) *authTokenDto {
	return &authTokenDto{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}
}

type authResultDto struct {
	User *userDto      `json:"user"`
	Auth *authTokenDto `json:"auth"`
}
