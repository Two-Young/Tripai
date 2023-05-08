package database

type UserEntity struct {
	UserId       *string `db:"uid" json:"userId"`
	Id           *string  `db:"id" json:"id"`
	Username     *string `db:"username" json:"username"`
	ProfileImage *string `db:"profile_image" json:"profile_image"`
	Platform     *string `db:"platform" json:"platform"`
}
