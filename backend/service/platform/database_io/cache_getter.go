package database_io

import (
	"context"
	"errors"
	"travel-ai/log"
	"travel-ai/service/database"
	"travel-ai/third_party/google_cloud/maps"
)

var (
	ErrCacheNotFound = errors.New("cache not found")
)

func GetPlaceDetailCache(ctx context.Context, placeId string) (*database.PlaceDetailCacheEntity, error) {
	// check for cache
	cache, err := ReadPlaceDetailCachesByPlaceId(ctx, placeId)
	if err != nil {
		log.Warn(err)
	}
	if cache == nil {
		// check for api
		result, err := maps.GetPlaceDetail(placeId)
		if err != nil {
			return nil, err
		}

		countryCode := ""
		for _, component := range result.AddressComponents {
			for _, componentType := range component.Types {
				if componentType == "country" {
					countryCode = component.ShortName
					break
				}
			}
		}

		latLng := result.Geometry.Location.String()
		hit := 0
		placeDetailCache := &database.PlaceDetailCacheEntity{
			PlaceId:        &result.PlaceID,
			Name:           &result.Name,
			Address:        &result.FormattedAddress,
			PhotoReference: nil,
			Longitude:      &result.Geometry.Location.Lng,
			Latitude:       &result.Geometry.Location.Lat,
			LatLng:         &latLng,
			CountryCode:    &countryCode,
			Hit:            &hit,
		}
		if len(result.Photos) > 0 {
			placeDetailCache.PhotoReference = &result.Photos[0].PhotoReference
		}

		cache = placeDetailCache
	}

	if err := WritePlaceDetailCaches(ctx, placeId, cache); err != nil {
		log.Warn(err)
	}

	return cache, nil
}