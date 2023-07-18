package database

type UserEntity struct {
	UserId       *string `db:"uid" json:"userId"`
	Id           *string `db:"id" json:"id"`
	Username     *string `db:"username" json:"username"`
	ProfileImage *string `db:"profile_image" json:"profile_image"`
	Platform     *string `db:"platform" json:"platform"`
}

type SessionEntity struct {
	SessionId     *string `db:"sid" json:"session_id"`
	CreatorUserId *string `db:"creator_uid" json:"creator_user_id"`
	Name          *string `db:"name" json:"name"`
	StartAt       *string `db:"start_at" json:"start_at"`
	EndAt         *string `db:"end_at" json:"end_at"`
	CreatedAt     *int64  `db:"created_at" json:"created_at"` //timestamp
	Budget        *string `db:"budget" json:"budget"`
	Unit          *string `db:"unit" json:"unit"` // budget unit
}

type CountryEntity struct {
	SessionCountryId  *string `db:"scid" json:"session_country_id"`
	CountryCode       *string `db:"country_code" json:"country_code"`
	SessionId         *string `db:"sid" json:"session_id"`
	AirlineReserveUrl *string `db:"airline_reserve_url" json:"airline_reserve_url"`
}
