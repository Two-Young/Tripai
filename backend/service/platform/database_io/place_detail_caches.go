package database_io

import (
	"context"
	"database/sql"
	"errors"
	"travel-ai/log"
	"travel-ai/service/database"
)

func ReadPlaceDetailCachesByPlaceId(placeId string) (*database.PlaceDetailCacheEntity, error) {
	// read
	var placeDetailCache database.PlaceDetailCacheEntity
	if err := database.DB.Get(&placeDetailCache, "SELECT * FROM place_detail_caches WHERE place_id = ?;", placeId); err != nil {
		return nil, err
	}
	return &placeDetailCache, nil
}

func WritePlaceDetailCaches(context context.Context, placeId string, entity *database.PlaceDetailCacheEntity) error {
	tx, err := database.DB.BeginTxx(context, nil)
	if err != nil {
		return err
	}

	// read
	var original *database.PlaceDetailCacheEntity
	original, err = ReadPlaceDetailCachesByPlaceId(placeId)
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		log.Warn(err)
	}

	hit := 0
	if original != nil {
		hit = *original.Hit + 1
		if _, err := tx.Exec(
			"UPDATE place_detail_caches SET hit = ? WHERE place_id = ?;",
			hit, placeId); err != nil {
			_ = tx.Rollback()
			return err
		}
	} else {
		if _, err := tx.Exec(
			"INSERT INTO place_detail_caches (place_id, name, address, photo_reference, latitude, longitude, lat_lng, country_code, hit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);",
			placeId,
			entity.Name,
			entity.Address,
			entity.PhotoReference,
			entity.Latitude,
			entity.Longitude,
			entity.LatLng,
			entity.CountryCode,
			0); err != nil {
			_ = tx.Rollback()
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}
