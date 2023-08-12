package database

import "time"

type UserEntity struct {
	UserId       *string `db:"uid" json:"userId"`
	Id           *string `db:"id" json:"id"`
	Username     *string `db:"username" json:"username"`
	ProfileImage *string `db:"profile_image" json:"profile_image"`
	Platform     *string `db:"platform" json:"platform"`
}

type SessionEntity struct {
	SessionId     *string    `db:"sid" json:"session_id"`
	CreatorUserId *string    `db:"creator_uid" json:"creator_user_id"`
	Name          *string    `db:"name" json:"name"`
	StartAt       *time.Time `db:"start_at" json:"start_at"`
	EndAt         *time.Time `db:"end_at" json:"end_at"`
	CreatedAt     *time.Time `db:"created_at" json:"created_at"` //timestamp
	Budget        *float64   `db:"budget" json:"budget"`
	Unit          *string    `db:"unit" json:"unit"` // budget unit
	ThumbnailUrl  *string    `db:"thumbnail_url" json:"thumbnail_url"`
}

type CountryEntity struct {
	SessionCountryId  *string `db:"scid" json:"session_country_id"`
	CountryCode       *string `db:"country_code" json:"country_code"`
	SessionId         *string `db:"sid" json:"session_id"`
	AirlineReserveUrl *string `db:"airline_reserve_url" json:"airline_reserve_url"`
}

type LocationEntity struct {
	LocationId     *string  `db:"lid" json:"location_id"`
	PlaceId        *string  `db:"place_id" json:"place_id"`
	Name           *string  `db:"name" json:"name"`
	Latitude       *float64 `db:"latitude" json:"latitude"`
	Longitude      *float64 `db:"longitude" json:"longitude"`
	Address        *string  `db:"address" json:"address"`
	PhotoReference *string  `db:"photo_reference" json:"photo_reference"`
	SessionId      *string  `db:"sid" json:"session_id"`
}

type ScheduleEntity struct {
	ScheduleId     *string    `db:"schid" json:"schedule_id"`
	Name           *string    `db:"name" json:"name"`
	PhotoReference *string    `db:"photo_reference" json:"photo_reference"`
	PlaceId        *string    `db:"place_id" json:"place_id"`
	Address        *string    `db:"address" json:"address"`
	StartAt        *time.Time `db:"start_at" json:"start_at"`
	SessionId      *string    `db:"sid" json:"session_id"`
}

type SessionThumbnailCacheEntity struct {
	Keyword *string `db:"keyword" json:"keyword"`
	Url     *string `db:"url" json:"url"`
}

type PlaceDetailCacheEntity struct {
	PlaceId        *string  `db:"place_id" json:"place_id"`
	Name           *string  `db:"name" json:"name"`
	Address        *string  `db:"address" json:"address"`
	PhotoReference *string  `db:"photo_reference" json:"photo_reference"`
	Latitude       *float64 `db:"latitude" json:"latitude"`
	Longitude      *float64 `db:"longitude" json:"longitude"`
	LatLng         *string  `db:"lat_lng" json:"lat_lng"`
	CountryCode    *string  `db:"country_code" json:"country_code"`
	Hit            *int     `db:"hit" json:"hit"`
}
