package database_io

import (
	"context"
	"travel-ai/log"
	"travel-ai/service/database"
)

// TODO :: validate transactions (cause of "Too many connections" error?)

func ReadPlaceDetailCachesByPlaceId(context context.Context, placeId string) (*database.PlaceDetailCacheEntity, error) {
	ctx, err := database.DB.BeginTxx(context, nil)
	if err != nil {
		return nil, err
	}

	// read
	var placeDetailCache database.PlaceDetailCacheEntity
	result := ctx.QueryRowx("SELECT * FROM place_detail_caches WHERE place_id = ?;", placeId)
	if err != nil {
		return nil, err
	}
	if err := result.StructScan(&placeDetailCache); err != nil {
		return nil, err
	}
	return &placeDetailCache, nil
}

func WritePlaceDetailCaches(context context.Context, placeId string, entity *database.PlaceDetailCacheEntity) error {
	ctx, err := database.DB.BeginTxx(context, nil)
	if err != nil {
		return err
	}

	// read
	var original *database.PlaceDetailCacheEntity
	original, err = ReadPlaceDetailCachesByPlaceId(context, placeId)
	if err != nil {
		log.Warn(err)
	}

	hit := 0
	if original != nil {
		hit = *original.Hit + 1
		if _, err := ctx.Exec(
			"UPDATE place_detail_caches SET hit = ? WHERE place_id = ?;",
			hit, placeId); err != nil {
			ctx.Rollback()
			return err
		}
	} else {
		if _, err := ctx.Exec(
			"INSERT INTO place_detail_caches (place_id, name, address, photo_reference, latitude, longitude, lat_lng, country_code, hit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
			placeId,
			*entity.Name,
			*entity.Address,
			*entity.PhotoReference,
			*entity.Latitude,
			*entity.Longitude,
			*entity.LatLng,
			*entity.CountryCode,
			0); err != nil {
			ctx.Rollback()
			return err
		}
	}

	if err := ctx.Commit(); err != nil {
		return err
	}

	return nil
}
