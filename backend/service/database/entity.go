package database

import "time"

type UserEntity struct {
	UserId              *string `db:"uid" json:"user_id"`
	Id                  *string `db:"id" json:"id"`
	UserCode            string  `db:"user_code" json:"user_code"`
	Username            *string `db:"username" json:"username"`
	ProfileImage        *string `db:"profile_image" json:"profile_image"`
	Platform            *string `db:"platform" json:"platform"`
	AllowNicknameSearch bool    `db:"allow_nickname_search" json:"allow_nickname_search"`
}

type FriendEntity struct {
	UserId          string     `db:"uid" json:"user_id"`
	RequestedUserId string     `db:"requested_uid" json:"requested_user_id"`
	Accepted        bool       `db:"accepted" json:"accepted"`
	RequestedAt     time.Time  `db:"requested_at" json:"requested_at"`
	ConfirmedAt     *time.Time `db:"confirmed_at" json:"confirmed_at"`
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
	ScheduleId     *string    `db:"sscid" json:"schedule_id"`
	Name           *string    `db:"name" json:"name"`
	PhotoReference *string    `db:"photo_reference" json:"photo_reference"`
	PlaceId        *string    `db:"place_id" json:"place_id"`
	Address        *string    `db:"address" json:"address"`
	Day            *int64     `db:"day" json:"day"`
	Latitude       *float64   `db:"latitude" json:"latitude"`
	Longitude      *float64   `db:"longitude" json:"longitude"`
	StartAt        *time.Time `db:"start_at" json:"start_at"`
	Memo           *string    `db:"memo" json:"memo"`
	SessionId      *string    `db:"sid" json:"session_id"`
}

type ReceiptEntity struct {
	ReceiptId        string  `db:"rid" json:"receipt_id"`
	Name             string  `db:"name" json:"name"`
	OriginalFilename string  `db:"original_filename" json:"original_filename"`
	Filename         string  `db:"filename" json:"filename"`
	SessionId        string  `db:"sid" json:"session_id"`
	TotalPrice       float64 `db:"total_price" json:"total_price"`
	Unit             string  `db:"unit" json:"unit"`
	Type             string  `db:"type" json:"type"`
	Width            int     `db:"width" json:"width"`
	Height           int     `db:"height" json:"height"`
}

type ReceiptItemBoxEntity struct {
	ReceiptItemBoxId string `db:"ribid" json:"receipt_item_box_id"`
	Text             string `db:"text" json:"text"`
	Top              int    `db:"top" json:"top"`
	Left             int    `db:"left" json:"left"`
	Width            int    `db:"width" json:"width"`
	Height           int    `db:"height" json:"height"`

	ReceiptId string `db:"rid" json:"receipt_id"`
}

type ReceiptItemEntity struct {
	ReceiptItemId string  `db:"riid" json:"receipt_item_id"`
	Label         string  `db:"label" json:"label"`
	LabelBoxId    *string `db:"label_box_id" json:"label_box_id"`
	Price         float64 `db:"price" json:"price"`
	PriceBoxId    *string `db:"price_box_id" json:"price_box_id"`

	ReceiptId string `db:"rid" json:"receipt_id"`
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
