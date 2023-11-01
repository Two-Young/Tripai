package database_io

import (
	"database/sql"
	"travel-ai/service/database"
)

func GetTransactionsBySessionId(sessionId string) ([]database.TransactionEntity, error) {
	var transactions []database.TransactionEntity
	if err := database.DB.Select(&transactions,
		"SELECT * FROM transactions WHERE sid = ?;", sessionId); err != nil {
		return nil, err
	}
	return transactions, nil
}

func InsertTransactionTx(tx *sql.Tx, sessionId string, transaction *database.TransactionEntity) error {
	if _, err := tx.Exec(
		"INSERT INTO transactions (sender_uid, receiver_uid, amount, sent_at, sid) VALUES (?, ?, ?, ?, ?);",
		transaction.SenderUid,
		transaction.ReceiverUid,
		transaction.Amount,
		transaction.SentAt,
		sessionId); err != nil {
		return err
	}
	return nil
}
