package database_io

import "travel-ai/service/database"

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
		return nil, err
	}
	return schedules, nil
}
