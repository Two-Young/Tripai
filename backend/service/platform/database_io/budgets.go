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

func GetBudgetsBySessionIdAndUserId(sessionId string, userId string) ([]database.BudgetEntity, error) {
	var budgets []database.BudgetEntity
	if err := database.DB.Select(&budgets,
		`SELECT budgets.* FROM budgets
		WHERE budgets.sid = ? AND uid = ?;`, sessionId, userId); err != nil {
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

func UpdateBudgetTx(tx *sql.Tx, budgetId string, amount float64) error {
	if _, err := tx.Exec(`
		UPDATE budgets SET amount = ?
		WHERE bid = ?;`,
		amount, budgetId,
	); err != nil {
		return err
	}
	return nil
}

func InsertBudgetTx(tx *sql.Tx, budget database.BudgetEntity) error {
	if _, err := tx.Exec(`
		INSERT INTO budgets(bid, currency_code, amount, uid, sid) 
		VALUES (?, ?, ?, ?, ?);`,
		budget.BudgetId, budget.CurrencyCode, budget.Amount,
		budget.UserId, budget.SessionId,
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
