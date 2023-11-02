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

type ExpenditureDistributionsEntity struct {
	database.ExpenditureEntity
	UserId      string `db:"uid" json:"user_id"`
	Numerator   int64  `db:"num" json:"numerator"`
	Denominator int64  `db:"denom" json:"denominator"`
}

type ExpenditureWithPayerEntity struct {
	database.ExpenditureEntity
	UserId string `db:"uid" json:"user_id"`
}

type ExpenditureDistributionWithPayerMapEntity struct {
	database.ExpenditureEntity
	Distributions []database.ExpenditureDistributionEntity
	Payers        []string
}

func GetExpenditureDistributionWithPayersBySessionId(sessionId string) ([]*ExpenditureDistributionWithPayerMapEntity, error) {
	var result []*ExpenditureDistributionWithPayerMapEntity
	var dists []ExpenditureDistributionsEntity
	var payers []ExpenditureWithPayerEntity

	if err := database.DB.Select(&dists,
		`SELECT expenditures.*, ed.uid, ed.num, ed.denom
		FROM expenditure_distribution ed
		INNER JOIN expenditures ON ed.eid = expenditures.eid
		WHERE expenditures.sid = ?;`, sessionId); err != nil {
		return nil, err
	}

	if err := database.DB.Select(&payers,
		`SELECT expenditures.*, users.uid
		FROM expenditure_payers ep
		INNER JOIN expenditures ON ep.eid = expenditures.eid
		INNER JOIN users ON ep.uid = users.uid
		WHERE expenditures.sid = ?;`, sessionId); err != nil {
		return nil, err
	}

	// group by expenditure id
	distsMap := make(map[string]*ExpenditureDistributionWithPayerMapEntity)
	for _, dist := range dists {
		if _, ok := distsMap[dist.ExpenditureId]; !ok {
			distsMap[dist.ExpenditureId] = &ExpenditureDistributionWithPayerMapEntity{
				ExpenditureEntity: dist.ExpenditureEntity,
				Distributions:     make([]database.ExpenditureDistributionEntity, 0),
				Payers:            make([]string, 0),
			}
		}
		distsMap[dist.ExpenditureId].Distributions = append(distsMap[dist.ExpenditureId].Distributions, database.ExpenditureDistributionEntity{
			ExpenditureId: dist.ExpenditureId,
			UserId:        dist.UserId,
			Numerator:     dist.Numerator,
			Denominator:   dist.Denominator,
		})
	}

	for _, payer := range payers {
		if _, ok := distsMap[payer.ExpenditureId]; !ok {
			distsMap[payer.ExpenditureId] = &ExpenditureDistributionWithPayerMapEntity{
				ExpenditureEntity: payer.ExpenditureEntity,
				Distributions:     make([]database.ExpenditureDistributionEntity, 0),
				Payers:            make([]string, 0),
			}
		}

		distsMap[payer.ExpenditureId].Payers = append(distsMap[payer.ExpenditureId].Payers, payer.UserId)
	}

	// to list
	for _, dist := range distsMap {
		result = append(result, dist)
	}

	return result, nil
}
