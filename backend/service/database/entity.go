package database

type UserEntity struct {
	UserId                *string `db:"uid" json:"userId"`
	Username              *string `db:"username" json:"username"`
	AuthId                *string `db:"auth_id" json:"authId"`
	AuthEncryptedPw       *string `db:"auth_encrypted_pw" json:"-"`
	AuthProfileImageUrl   *string `db:"auth_profile_image_url" json:"authProfileImageUrl"`
	GoogleAuthId          *string `db:"google_auth_id" json:"googleAuthId"`
	GoogleEmail           *string `db:"google_email" json:"googleEmail"`
	GoogleProfileImageUrl *string `db:"google_profile_image_url" json:"googleProfileImageUrl"`
}
