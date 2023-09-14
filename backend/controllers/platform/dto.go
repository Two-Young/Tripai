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
	SessionCode   string   `json:"session_code"`
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

type sessionSupportedCurrenciesRequestDto struct {
	SessionId string `form:"session_id" binding:"required"`
}

type sessionSupportedCurrenciesResponseItem struct {
	CurrencyCode   string `json:"currency_code"`
	CurrencyName   string `json:"currency_name"`
	CurrencySymbol string `json:"currency_symbol"`
}

// key: country code
type sessionSupportedCurrenciesResponseDto map[string][]sessionSupportedCurrenciesResponseItem

type sessionInviteRequestDto struct {
	SessionId    string `json:"session_id" binding:"required"`
	TargetUserId string `json:"target_user_id" binding:"required"`
}

type sessionInviteCancelRequestDto struct {
	SessionId    string `json:"session_id" binding:"required"`
	TargetUserId string `json:"target_user_id" binding:"required"`
}

type sessionInviteWaitingRequestDto struct {
	SessionId string `form:"session_id" binding:"required"`
}

type sessionInviteWaitingResponseItem struct {
	UserId       string `json:"user_id"`
	Username     string `json:"username"`
	ProfileImage string `json:"profile_image"`
	InvitedAt    int64  `json:"invited_at"`
}

type sessionInviteWaitingResponseDto []sessionInviteWaitingResponseItem

type sessionInviteRequestsResponseItem struct {
	SessionId    string `json:"session_id"`
	SessionCode  string `json:"session_code"`
	SessionName  string `json:"session_name"`
	ThumbnailUrl string `json:"thumbnail_url"`
	InvitedAt    int64  `json:"requested_at"`
}

type sessionInviteRequestsResponseDto []sessionInviteRequestsResponseItem

type sessionInviteConfirmRequestDto struct {
	SessionId string `json:"session_id" binding:"required"`
	Accept    bool   `json:"accept" binding:"required"`
}

type sessionJoinRequestDto struct {
	SessionCode string `json:"session_code" binding:"required"`
}

type sessionJoinCancelRequestDto struct {
	SessionId string `json:"session_id" binding:"required"`
}

type sessionJoinRequestsRequestDto struct {
	SessionId string `form:"session_id" binding:"required"`
}

type sessionJoinRequestsResponseItem struct {
	UserId       string `json:"user_id"`
	Username     string `json:"username"`
	ProfileImage string `json:"profile_image"`
	RequestedAt  int64  `json:"requested_at"`
}

type sessionJoinRequestsResponseDto []sessionJoinRequestsResponseItem

type sessionJoinWaitingsResponseItem struct {
	SessionId    string `json:"session_id"`
	SessionCode  string `json:"session_code"`
	SessionName  string `json:"session_name"`
	ThumbnailUrl string `json:"thumbnail_url"`
	RequestedAt  int64  `json:"requested_at"`
}

type sessionJoinWaitingsResponseDto []sessionJoinWaitingsResponseItem

type sessionJoinConfirmRequestDto struct {
	SessionId string `json:"session_id" binding:"required"`
	UserId    string `json:"user_id" binding:"required"`
	Accept    bool   `json:"accept" binding:"required"`
}

type sessionExpelRequestDto struct {
	SessionId string `json:"session_id" binding:"required"`
	UserId    string `json:"user_id" binding:"required"`
}

type sessionLeaveRequestDto struct {
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
	Memo           *string  `json:"memo"`
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
type receiptTextItemBoundary struct {
	Top    int `json:"top"`
	Left   int `json:"left"`
	Width  int `json:"width"`
	Height int `json:"height"`
}

type receiptItemBox struct {
	ReceiptItemBoxId string                  `json:"box_id"`
	Text             string                  `json:"text"`
	Boundary         receiptTextItemBoundary `json:"boundary"`
}

type receiptLabelItem struct {
	ReceiptIemBoxId *string `json:"box_id"`
	Text            string  `json:"text"`
}

type receiptPriceItem struct {
	ReceiptIemBoxId *string `json:"box_id"`
	Value           float64 `json:"value"`
}

type receiptTextItem struct {
	ReceiptItemId string           `json:"item_id"`
	Label         receiptLabelItem `json:"label"`
	Price         receiptPriceItem `json:"price"`
}

type receiptImageResolution struct {
	Width  int `json:"width"`
	Height int `json:"height"`
}

type receiptGetRequestDto struct {
	SessionId string `form:"session_id" binding:"required"`
}

type receiptGetResponseItem struct {
	ReceiptId string `json:"receipt_id"`
	Name      string `json:"name"`
}

type receiptGetResponseDto []receiptGetResponseItem

type receiptGetImageRequestDto struct {
	ReceiptId string `form:"receipt_id" binding:"required"`
}

type receiptGetCurrentRequestDto struct {
	ReceiptId string `form:"receipt_id" binding:"required"`
}

type receiptGetCurrentResponseDto struct {
	ItemBoxes  []receiptItemBox       `json:"item_boxes"`
	Items      []receiptTextItem      `json:"items"`
	Resolution receiptImageResolution `json:"resolution"`
}

type receiptUploadRequestDto struct {
	SessionId string `form:"session_id" binding:"required"`
}

type receiptSelectedBoxInfo struct {
	Custom bool    `json:"custom" binding:"required"`
	BoxId  *string `json:"box_id" binding:"required"`
	Text   string  `json:"text" binding:"required"`
}

type receiptSelectedTextItem struct {
	Label receiptSelectedBoxInfo `json:"label" binding:"required"`
	Price receiptSelectedBoxInfo `json:"price" binding:"required"`
}

type receiptSubmitRequestDto struct {
	ReceiptId string                    `json:"receipt_id" binding:"required"`
	Items     []receiptSelectedTextItem `json:"items" binding:"required"`
}

/* ---------------- Currency ---------------- */
type currencyGetSupportedResponseItem struct {
	CountryCode    string `json:"country_code"`
	CurrencyCode   string `json:"currency_code"`
	CurrencyName   string `json:"currency_name"`
	CurrencySymbol string `json:"currency_symbol"`
}

type currencyGetSupportedResponseDto []currencyGetSupportedResponseItem

type currencyExchangeRateRequestDto struct {
	FromCurrencyCode string `form:"from_currency_code" binding:"required"`
	ToCurrencyCode   string `form:"to_currency_code" binding:"required"`
}

/* ---------------- Friends ---------------- */
type friendsGetResponseItem struct {
	UserId       string `json:"user_id" binding:"required"`
	UserCode     string `json:"user_code" binding:"required"`
	Username     *string `json:"username" binding:"required"`
	ProfileImage *string `json:"profile_image" binding:"required"`
	AcceptedAt   int64  `json:"accepted_at" binding:"required"`
}

type friendsGetResponseDto []friendsGetResponseItem

type friendsRequestRequestDto struct {
	TargetUserId string `json:"target_user_id" binding:"required"`
}

type friendsAcceptRequestDto struct {
	RequestedUserId string `json:"requested_user_id" binding:"required"`
}

type friendsRequestCancelRequestDto struct {
	TargetUserId string `json:"target_user_id" binding:"required"`
}

type friendsRejectRequestDto struct {
	RequestedUserId string `json:"requested_user_id" binding:"required"`
}

type friendsDeleteRequestDto struct {
	TargetUserId string `json:"target_user_id" binding:"required"`
}

type friendsWaitingRequests struct {
	UserId       string  `json:"user_id" binding:"required"`
	Username     *string `json:"username" binding:"required"`
	ProfileImage *string `json:"profile_image" binding:"required"`
	RequestedAt  int64   `json:"requested_at" binding:"required"`
}

type friendsWaitingRequestsResponseDto struct {
	Sent     []friendsWaitingRequests `json:"sent"`
	Received []friendsWaitingRequests `json:"received"`
}

type friendsSearchRequestDto struct {
	Query string `form:"query" binding:"required"`
}

type friendsSearchResponseItem struct {
	UserId       string `json:"user_id" binding:"required"`
	UserCode     string `json:"user_code" binding:"required"`
	Username     string `json:"username" binding:"required"`
	ProfileImage string `json:"profile_image" binding:"required"`
}

type friendsSearchResponseDto []friendsSearchResponseItem

/* ---------------- Users ---------------- */
type userGetProfileResponseDto struct {
	Username            string `json:"username"`
	ProfileImage        string `json:"profile_image"`
	AllowNicknameSearch bool   `json:"allow_nickname_search"`
}
