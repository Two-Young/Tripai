package platform

/* ---------------- Locate ---------------- */
type locateCoordinate struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type placeDetail struct {
	PlaceId        string  `json:"place_id"`
	Name           string  `json:"name"`
	Address        string  `json:"address"`
	PhotoReference string  `json:"photo_reference"`
	Longitude      float64 `json:"longitude"`
	Latitude       float64 `json:"latitude"`
}

// Auto Complete
type locateAutocompleteRequestDto struct {
	Input string `json:"input" binding:"required"`
}

type locateAutocompletePrediction struct {
	Description string `json:"description"`
	PlaceId     string `json:"place_id"`
}

type locateAutocompleteResponseDto []locateAutocompletePrediction

// Pin
type locatePinResponseDto []placeDetail

type locateLocationQueryDto struct {
	PlaceId string `form:"place_id" binding:"required"`
}

type locatePlacePhotoQueryDto struct {
	Reference string `form:"reference" binding:"required"`
	MaxWidth  uint   `form:"max_width" binding:"required"`
}

type locateLocationResponseDto placeDetail

type locatePinRequestDto struct {
	Latitude  float64 `form:"latitude" binding:"required"`
	Longitude float64 `form:"longitude" binding:"required"`
}

type locateDirectionQueryDto struct {
	OriginalPlaceId    string `form:"origin_place_id" binding:"required"`
	DestinationPlaceId string `form:"destination_place_id" binding:"required"`
}

type locateDirectionResponseDto []locateCoordinate

/* ---------------- Session ---------------- */
type sessionsResponseItem struct {
	SessionId     string   `json:"session_id"`
	CreatorUserId string   `json:"creator_user_id"`
	Name          string   `json:"name"`
	StartAt       string   `json:"start_at"`
	EndAt         string   `json:"end_at"`
	CreatedAt     int64    `json:"created_at"` //timestamp
	CountryCodes  []string `json:"country_codes"`
	ThumbnailUrl  string   `json:"thumbnail_url"`
}

type sessionsResponseDto []sessionsResponseItem

type sessionCreateRequestDto struct {
	CountryCodes []string `json:"country_codes" binding:"required"`
	StartAt      string   `json:"start_at" binding:"required"`
	EndAt        string   `json:"end_at" binding:"required"`
}

type sessionDeleteRequestDto struct {
	SessionId string `json:"session_id" binding:"required"`
}

/* ---------------- Location ---------------- */
type locationsRequestDto struct {
	SessionId string `form:"session_id" binding:"required"`
}

type locationsResponseItem struct {
	LocationId     string  `json:"location_id"`
	PlaceId        string  `json:"place_id"`
	Name           string  `json:"name"`
	Latitude       float64 `json:"latitude"`
	Longitude      float64 `json:"longitude"`
	PhotoReference string  `json:"photo_reference"`
	Address        string  `json:"address"`
}

type locationsResponseDto []locationsResponseItem

type locationCreateRequestDto struct {
	SessionId string `json:"session_id" binding:"required"`
	PlaceId   string `json:"place_id" binding:"required"`
}

type locationDeleteRequestDto struct {
	LocationId string `json:"location_id" binding:"required"`
}

/* ---------------- Schedule ---------------- */
type schedulesRequestDto struct {
	SessionId string `form:"session_id" binding:"required"`
	Day       int64  `form:"day" binding:"required"`
}

type schedulesResponseItem struct {
	ScheduleId     string   `json:"schedule_id"`
	Name           string   `json:"name"`
	PhotoReference *string  `json:"photo_reference"`
	PlaceId        *string  `json:"place_id"`
	Address        *string  `json:"address"`
	Latitude       *float64 `json:"latitude"`
	Longitude      *float64 `json:"longitude"`
	StartAt        int64    `json:"start_at"`
}

type schedulesResponseDto []schedulesResponseItem

type scheduleCreateRequestDto struct {
	SessionId string `json:"session_id" binding:"required"`
	Name      string `json:"name"`
	PlaceId   string `json:"place_id"`
	StartAt   int64  `json:"start_at" binding:"required"`
	Memo      string `json:"memo"`
}

type scheduleEditRequestDto struct {
	ScheduleId string `json:"schedule_id" binding:"required"`
	Name       string `json:"name"`
	PlaceId    string `json:"place_id"`
	StartAt    int64  `json:"start_at" binding:"required"`
	Memo       string `json:"memo"`
}

type scheduleDeleteRequestDto struct {
	ScheduleId string `json:"schedule_id" binding:"required"`
}

/* ---------------- Receipt ---------------- */
type receiptUploadRequestDto struct {
	SessionId string `form:"session_id" binding:"required"`
}

type receiptTextItemBoundary struct {
	Top    int `json:"top"`
	Left   int `json:"left"`
	Width  int `json:"width"`
	Height int `json:"height"`
}

type receiptTextItem struct {
	Boundary receiptTextItemBoundary `json:"boundary"`
	Text     string                  `json:"value"`
}

type receiptImageResolution struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type receiptUploadResponseDto struct {
	Items      []receiptTextItem      `json:"items"`
	Resolution receiptImageResolution `json:"resolution"`
	ReceiptId  string                 `json:"receipt_id"`
}

type receiptSelectedTextItem struct {
	Name     string                  `json:"name"`
	Price    int                     `json:"price"`
	UsersId  []string                `json:"users_id"`
	Boundary receiptTextItemBoundary `json:"boundary"`
}

type receiptSubmitRequestDto struct {
	ReceiptId string                    `json:"receipt_id" binding:"required"`
	Items     []receiptSelectedTextItem `json:"items" binding:"required"`
	Name      string                    `json:"name" binding:"required"`
	Type      string                    `json:"type" binding:"required"`
}
