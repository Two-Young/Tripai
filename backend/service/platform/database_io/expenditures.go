package database_io

import (
	"database/sql"
	"time"
	"travel-ai/service/database"
)

type ExpenditureHasReceiptEntity struct {
	database.ExpenditureEntity
	HasReceipt bool `db:"has_receipt" json:"has_receipt"`
}

func GetExpendituresBySessionId(sessionId string) ([]ExpenditureHasReceiptEntity, error) {
	var expenditures []ExpenditureHasReceiptEntity
	// if expenditure item exists, then has receipt
	if err := database.DB.Select(&expenditures,
		`SELECT expenditures.*, IF(expenditure_items.eid IS NULL, FALSE, TRUE) AS has_receipt
		FROM expenditures
		LEFT JOIN expenditure_items ON expenditures.eid = expenditure_items.eid
		WHERE expenditures.sid = ?;`, sessionId); err != nil {
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
		INSERT INTO expenditures(eid, name, total_price, currency_code, category, sid, payed_at) 
		VALUES (?, ?, ?, ?, ?, ?, ?);`,
		expenditure.ExpenditureId, expenditure.Name, expenditure.TotalPrice, expenditure.CurrencyCode,
		expenditure.Category, expenditure.SessionId, expenditure.PayedAt,
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

func GetExpenditurePayers(expenditureId string) ([]database.ExpenditurePayerEntity, error) {
	var payers []database.ExpenditurePayerEntity
	if err := database.DB.Select(&payers,
		"SELECT * FROM expenditure_payers WHERE eid = ?;", expenditureId); err != nil {
		return nil, err
	}
	return payers, nil
}

func InsertExpenditurePayerTx(tx *sql.Tx, expenditurePayer database.ExpenditurePayerEntity) error {
	if _, err := tx.Exec(`
		INSERT INTO expenditure_payers(eid, uid) 
		VALUES (?, ?);`,
		expenditurePayer.ExpenditureId, expenditurePayer.UserId,
	); err != nil {
		return err
	}
	return nil
}

func InsertExpenditureDistributionTx(tx *sql.Tx, expenditureDistribution database.ExpenditureDistributionEntity) error {
	if _, err := tx.Exec(`
		INSERT INTO expenditure_distribution(eid, uid, num, denom) 
		VALUES (?, ?, ?, ?);`,
		expenditureDistribution.ExpenditureId, expenditureDistribution.UserId,
		expenditureDistribution.Numerator, expenditureDistribution.Denominator,
	); err != nil {
		return err
	}
	return nil
}

func GetExpenditureDistributions(expenditureId string) ([]database.ExpenditureDistributionEntity, error) {
	var distributions []database.ExpenditureDistributionEntity
	if err := database.DB.Select(&distributions,
		"SELECT * FROM expenditure_distribution WHERE eid = ?;", expenditureId); err != nil {
		return nil, err
	}
	return distributions, nil
}

type UserExpenditureDistributionEntity struct {
	database.ExpenditureDistributionEntity
	CurrencyCode string    `db:"currency_code" json:"currency_code"`
	PayedAt      time.Time `db:"payed_at" json:"payed_at"`
}

func GetExpenditureDistributionsBySessionIdAndUserId(sessionId string, userId string) ([]UserExpenditureDistributionEntity, error) {
	var distributions []UserExpenditureDistributionEntity
	if err := database.DB.Select(&distributions,
		`SELECT ed.*, expenditures.currency_code, expenditures.payed_at
		FROM expenditure_distribution ed
		INNER JOIN expenditures ON ed.eid = expenditures.eid
		WHERE expenditures.sid = ? AND ed.uid = ?;`, sessionId, userId); err != nil {
		return nil, err
	}
	return distributions, nil
}

type ExpenditureDistributionWithPayerEntity struct {
	database.ExpenditureEntity
	Distributions []database.ExpenditureDistributionEntity
	Payers        []database.UserEntity
}

func GetExpenditureDistributionWithPayersBySessionId(sessionId string) ([]*ExpenditureDistributionWithPayerEntity, error) {
	var distributions []*ExpenditureDistributionWithPayerEntity
	if err := database.DB.Select(&distributions,
		`SELECT expenditures.*, expenditure_distribution.*, users.* 
		FROM expenditures
		INNER JOIN expenditure_distribution ON expenditures.eid = expenditure_distribution.eid
		INNER JOIN users ON expenditure_distribution.uid = users.uid
		WHERE expenditures.sid = ?;`, sessionId); err != nil {
		return nil, err
	}
	return distributions, nil
}
