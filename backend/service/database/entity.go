package database

import "time"

type UserEntity struct {
	UserId              string  `db:"uid" json:"user_id"`
	Id                  *string `db:"id" json:"id"`
	UserCode            string  `db:"user_code" json:"user_code"`
	Username            string  `db:"username" json:"username"`
	ProfileImage        *string `db:"profile_image" json:"profile_image"`
	Platform            *string `db:"platform" json:"platform"`
	AllowNicknameSearch bool    `db:"allow_nickname_search" json:"allow_nickname_search"`
	DefaultCurrencyCode string  `db:"default_currency_code" json:"default_currency_code"`
}

type FriendEntity struct {
	UserId              string     `db:"uid" json:"user_id"`
	RequestedUserId     string     `db:"requested_uid" json:"requested_user_id"`
	Accepted            bool       `db:"accepted" json:"accepted"`
	RequestedAt         time.Time  `db:"requested_at" json:"requested_at"`
	ConfirmedAt         *time.Time `db:"confirmed_at" json:"confirmed_at"`
	AllowNicknameSearch bool       `db:"allow_nickname_search" json:"allow_nickname_search"`
}

type SessionEntity struct {
	SessionId     string     `db:"sid" json:"session_id"`
	SessionCode   string     `db:"session_code" json:"session_code"`
	CreatorUserId string     `db:"creator_uid" json:"creator_user_id"`
	Name          *string    `db:"name" json:"name"`
	StartAt       *time.Time `db:"start_at" json:"start_at"`
	EndAt         *time.Time `db:"end_at" json:"end_at"`
	CreatedAt     time.Time  `db:"created_at" json:"created_at"` //timestamp
	ThumbnailUrl  *string    `db:"thumbnail_url" json:"thumbnail_url"`
}

type UserSessionEntity struct {
	SessionId string    `db:"sid" json:"session_id"`
	UserId    string    `db:"uid" json:"user_id"`
	JoinedAt  time.Time `db:"joined_at" json:"joined_at"`
}

type SessionInvitationEntity struct {
	SessionId string    `db:"sid" json:"session_id"`
	UserId    string    `db:"uid" json:"user_id"`
	InvitedAt time.Time `db:"invited_at" json:"invited_at"`
}

type SessionJoinRequestEntity struct {
	SessionId   string    `db:"sid" json:"session_id"`
	UserId      string    `db:"uid" json:"user_id"`
	RequestedAt time.Time `db:"requested_at" json:"requested_at"`
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

type ExpenditureEntity struct {
	ExpenditureId string     `db:"eid" json:"expenditure_id"`
	Name          string     `db:"name" json:"name"`
	TotalPrice    float64    `db:"total_price" json:"price"`
	CurrencyCode  string     `db:"currency_code" json:"currency_code"`
	Category      string     `db:"category" json:"category"`
	PayedAt       *time.Time `db:"payed_at" json:"payed_at"`
	SessionId     string     `db:"sid" json:"session_id"`
}

type ExpenditurePayerEntity struct {
	ExpenditureId string `db:"eid" json:"expenditure_id"`
	UserId        string `db:"uid" json:"user_id"`
}

type ExpenditureDistributionEntity struct {
	ExpenditureId string `db:"eid" json:"expenditure_id"`
	UserId        string `db:"uid" json:"user_id"`
	Numerator     int64  `db:"num" json:"numerator"`
	Denominator   int64  `db:"denom" json:"denominator"`
}

type ExpenditureItemEntity struct {
	ExpenditureItemId string  `db:"eiid" json:"expenditure_item_id"`
	Label             string  `db:"label" json:"label"`
	Price             float64 `db:"price" json:"price"`
	ExpenditureId     string  `db:"eid" json:"expenditure_id"`
}

type ExpenditureItemAllocationEntity struct {
	ExpenditureItemId string `db:"eiid" json:"expenditure_item_id"`
	UserId            string `db:"uid" json:"user_id"`
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

type BudgetEntity struct {
	BudgetId     string  `db:"bid" json:"budget_id"`
	CurrencyCode string  `db:"currency_code" json:"currency_code"`
	Amount       float64 `db:"amount" json:"amount"`
	SessionId    string  `db:"sid" json:"session_id"`
}

type ExchangeRateEntity struct {
	FromCurrencyCode string    `db:"from_currency_code" json:"from_currency_code"`
	ToCurrencyCode   string    `db:"to_currency_code" json:"to_currency_code"`
	Rate             float64   `db:"rate" json:"rate"`
	UpdatedAt        time.Time `db:"updated_at" json:"updated_at"`
}
