package database_io

import (
	"database/sql"
	"travel-ai/service/database"
)

func GetExpendituresBySessionId(sessionId string) ([]database.ExpenditureEntity, error) {
	var expenditures []database.ExpenditureEntity
	if err := database.DB.Select(&expenditures,
		"SELECT * FROM expenditures WHERE sid = ?;", sessionId); err != nil {
		return nil, err
	}
	return expenditures, nil
}

func GetExpenditure(expenditureId string) (*database.ExpenditureEntity, error) {
	var expenditure database.ExpenditureEntity
	if err := database.DB.Get(&expenditure,
		"SELECT * FROM expenditures WHERE eid = ?;", expenditureId); err != nil {
		return nil, err
	}
	return &expenditure, nil
}

func InsertExpenditureTx(tx *sql.Tx, expenditure database.ExpenditureEntity) error {
	if _, err := tx.Exec(`
		INSERT INTO expenditures(eid, name, total_price, currency_code, category, is_custom, sid) 
		VALUES (?, ?, ?, ?, ?, ?, ?);`,
		expenditure.ExpenditureId, expenditure.Name, expenditure.TotalPrice, expenditure.CurrencyCode,
		expenditure.Category, expenditure.IsCustom, expenditure.SessionId,
	); err != nil {
		return err
	}
	return nil
}

func DeleteExpenditureTx(tx *sql.Tx, expenditureId string) error {
	if _, err := tx.Exec(`
		DELETE FROM expenditures WHERE eid = ?;`,
		expenditureId,
	); err != nil {
		return err
	}
	return nil
}
