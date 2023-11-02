package database_io

import (
	"database/sql"
	"travel-ai/service/database"
)

func InsertLocationTx(tx *sql.Tx, location *database.LocationEntity) error {
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
