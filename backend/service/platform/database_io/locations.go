package database_io

import (
	"database/sql"
	"travel-ai/service/database"
)

func InsertLocationTx(tx *sql.Tx, location database.LocationEntity) error {
	if _, err := tx.Exec(`
		INSERT INTO locations (lid, place_id, name, latitude, longitude, address, photo_reference, sid) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
		location.LocationId, location.PlaceId, location.Name, location.Latitude, location.Longitude,
		location.Address, location.PhotoReference, location.SessionId,
	); err != nil {
		return err
	}
	return nil
}

func GetLocationByPlaceId(placeId string, sessionId string) (*database.LocationEntity, error) {
	var location database.LocationEntity
	if err := database.DB.Get(
		&location,
		"SELECT lid, place_id, name, latitude, longitude, photo_reference, address FROM locations WHERE place_id = ? AND sid = ?;",
		placeId, sessionId,
	); err != nil {
		return nil, err
	}
	return &location, nil
}