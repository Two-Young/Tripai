package controller

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

type locateCountriesItem struct {
	CountryCode string `json:"country_code"`
	Alt         string `json:"alt"`
	Png         string `json:"png"`
	Svg         string `json:"svg"`
	CommonName  string `json:"common_name"`
}

type locateCountriesResponseDto []locateCountriesItem

type sessionCreateRequestDto struct {
	CountryCodes []string `json:"country_codes" binding:"required"`
	StartAt      string   `json:"start_at" binding:"required"`
	EndAt        string   `json:"end_at" binding:"required"`
}
