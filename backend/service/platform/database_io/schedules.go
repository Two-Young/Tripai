package database_io

import (
	"database/sql"
	"errors"
	"travel-ai/service/database"
)

func GetSchedule(scheduleId string) (*database.ScheduleEntity, error) {
	var schedule database.ScheduleEntity
	if err := database.DB.Get(&schedule, "SELECT * FROM schedules WHERE sscid = ?;", scheduleId); err != nil {
		return nil, err
	}
	return &schedule, nil
}

func GetSchedulesByDayCode(sessionId string, dayCode int64) ([]database.ScheduleEntity, error) {
	var schedules []database.ScheduleEntity
	if err := database.DB.Select(&schedules, "SELECT * FROM schedules WHERE sid = ? AND day = ?;", sessionId, dayCode); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return make([]database.ScheduleEntity, 0), nil
		}
		return nil, err
	}
	return schedules, nil
}

func InsertScheduleTx(tx *sql.Tx, schedule database.ScheduleEntity) error {
	if _, err := tx.Exec(`
		INSERT INTO schedules (sscid, name, photo_reference, place_id, address, day, latitude, longitude, start_at, memo, sid) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
		schedule.ScheduleId, schedule.Name, schedule.PhotoReference,
		schedule.PlaceId, schedule.Address, schedule.Day,
		schedule.Latitude, schedule.Longitude, schedule.StartAt, schedule.Memo, schedule.SessionId,
	); err != nil {
		return err
	}
	return nil
}
