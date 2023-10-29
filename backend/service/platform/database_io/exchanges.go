package database_io

import (
	"time"
	"travel-ai/service/database"
)

func GetExchangeRate(from string, to string) (*database.ExchangeRateEntity, error) {
	var exchangeRate database.ExchangeRateEntity
	if err := database.DB.Get(&exchangeRate,
		"SELECT * FROM exchange_rates WHERE from_currency_code = ? AND to_currency_code = ?;",
		from, to); err != nil {
		return nil, err
	}
	return &exchangeRate, nil
}

func UpsertExchangeRate(from string, to string, rate float64) error {
	now := time.Now()
	if _, err := database.DB.Exec(`
		INSERT INTO exchange_rates(from_currency_code, to_currency_code, rate, updated_at) 
		VALUES (?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE rate = ?, updated_at = ?;`,
		from, to, rate, now,
		rate, now,
	); err != nil {
		return err
	}
	return nil
}
