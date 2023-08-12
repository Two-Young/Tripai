package places

import (
	"context"
	"googlemaps.github.io/maps"
	"os"
)

var ApiKey string

func Initialize() {
	ApiKey = os.Getenv("GOOGLE_CLOUD_API_KEY")
}

type AutocompleteResult struct {
}

func GetAutoComplete(query string) ([]maps.AutocompletePrediction, error) {
	c, err := maps.NewClient(maps.WithAPIKey(ApiKey))
	if err != nil {
		return nil, err
	}
	request := &maps.PlaceAutocompleteRequest{
		Input: query,
	}
	var response maps.AutocompleteResponse
	if response, err = c.PlaceAutocomplete(context.Background(), request); err != nil {
		return nil, err
	}
	return response.Predictions, nil
}

func GetPlaceDetail(placeId string) (*maps.PlaceDetailsResult, error) {
	c, err := maps.NewClient(maps.WithAPIKey(ApiKey))
	if err != nil {
		return nil, err
	}
	request := &maps.PlaceDetailsRequest{
		PlaceID: placeId,
	}
	var response maps.PlaceDetailsResult
	if response, err = c.PlaceDetails(context.Background(), request); err != nil {
		return nil, err
	}
	return &response, nil
}

func GetPlaceByLatLng(latitude float64, longitude float64) ([]maps.GeocodingResult, error) {
	c, err := maps.NewClient(maps.WithAPIKey(ApiKey))
	if err != nil {
		return nil, err
	}
	request := &maps.GeocodingRequest{
		LatLng: &maps.LatLng{Lat: latitude, Lng: longitude},
	}
	var response []maps.GeocodingResult
	if response, err = c.Geocode(context.Background(), request); err != nil {
		return nil, err
	}
	return response, nil
}

func GetPlacePhoto(photoReference string, maxWidth uint) (*maps.PlacePhotoResponse, error) {
	c, err := maps.NewClient(maps.WithAPIKey(ApiKey))
	if err != nil {
		return nil, err
	}
	request := &maps.PlacePhotoRequest{
		PhotoReference: photoReference,
		MaxWidth:       maxWidth,
	}
	var response maps.PlacePhotoResponse
	if response, err = c.PlacePhoto(context.Background(), request); err != nil {
		return nil, err
	}
	return &response, nil
}

func GetPlaceDirection(originLatLng string, destLatLng string) ([]maps.Route, error) {
	c, err := maps.NewClient(maps.WithAPIKey(ApiKey))
	if err != nil {
		return nil, err
	}

	request := &maps.DirectionsRequest{
		Origin:      originLatLng,
		Destination: destLatLng,
		Mode:        maps.TravelModeDriving,
	}
	var response []maps.Route
	if response, _, _ = c.Directions(context.Background(), request); err != nil {
		return nil, err
	}
	return response, nil
}
