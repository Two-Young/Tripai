package database_io

import (
	"database/sql"
	"travel-ai/service/database"
)

func GetBudgetsBySessionId(sessionId string) ([]database.BudgetEntity, error) {
	var budgets []database.BudgetEntity
	if err := database.DB.Select(&budgets,
		"SELECT * FROM budgets WHERE sid = ?;", sessionId); err != nil {
		return nil, err
	}
	return budgets, nil
}

func GetBudget(budgetId string) (*database.BudgetEntity, error) {
	var budget database.BudgetEntity
	if err := database.DB.Get(&budget,
		"SELECT * FROM budgets WHERE bid = ?;", budgetId); err != nil {
		return nil, err
	}
	return &budget, nil
}

func InsertBudgetTx(tx *sql.Tx, session database.BudgetEntity) error {
	if _, err := tx.Exec(`
		INSERT INTO budgets(bid, currency_code, amount, sid) 
		VALUES (?, ?, ?, ?);`,
		session.BudgetId, session.CurrencyCode, session.Amount, session.SessionId,
	); err != nil {
		return err
	}
	return nil
}

func DeleteBudgetTx(tx *sql.Tx, budgetId string) error {
	if _, err := tx.Exec(`
		DELETE FROM budgets WHERE bid = ?;`,
		budgetId,
	); err != nil {
		return err
	}
	return nil
}
