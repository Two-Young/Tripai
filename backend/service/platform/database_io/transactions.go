package database_io

import "travel-ai/service/database"

func GetTransactionsBySessionId(sessionId string) ([]database.TransactionEntity, error) {
	var transactions []database.TransactionEntity
	if err := database.DB.Select(&transactions,
		"SELECT * FROM transactions WHERE sid = ?;", sessionId); err != nil {
		return nil, err
	}
	return transactions, nil
}
