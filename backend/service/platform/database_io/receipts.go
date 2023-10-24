package database_io

import (
	"github.com/jmoiron/sqlx"
	"travel-ai/service/database"
)

func GetReceipts(expenditureId string) ([]*database.ReceiptEntity, error) {
	var receipts []*database.ReceiptEntity
	if err := database.DB.Select(&receipts, "SELECT * FROM receipts WHERE eid = ?;", expenditureId); err != nil {
		return nil, err
	}
	return receipts, nil
}

func InsertReceiptTx(tx *sqlx.Tx, receipt database.ReceiptEntity) error {
	if _, err := tx.Exec(
		"INSERT INTO receipts(rid, original_filename, filename, width, height, eid) VALUES (?, ?, ?, ?, ?, ?);",
		receipt.ReceiptId, receipt.OriginalFilename, receipt.Filename,
		receipt.Width, receipt.Height, receipt.ExpenditureId); err != nil {
		return err
	}
	return nil
}

func GetReceipt(receiptId string) (*database.ReceiptEntity, error) {
	var receipt database.ReceiptEntity
	if err := database.DB.Get(&receipt, "SELECT * FROM receipts WHERE rid = ?;", receiptId); err != nil {
		return nil, err
	}
	return &receipt, nil
}

func InsertReceiptItemTx(tx *sqlx.Tx, item database.ReceiptItemEntity) error {
	if _, err := tx.Exec(
		"INSERT INTO receipt_items(riid, rid, label, price) VALUES (?, ?, ?, ?);",
		item.ReceiptItemId, item.ReceiptId, item.Label, item.Price); err != nil {
		return err
	}
	return nil
}

func GetReceiptItems(receiptId string) ([]database.ReceiptItemEntity, error) {
	var items []database.ReceiptItemEntity
	if err := database.DB.Select(&items, "SELECT * FROM receipt_items WHERE rid = ?;", receiptId); err != nil {
		return nil, err
	}
	return items, nil
}
