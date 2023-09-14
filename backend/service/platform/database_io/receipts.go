package database_io

import (
	"github.com/jmoiron/sqlx"
	"travel-ai/service/database"
)

func GetReceipts(sessionId string) ([]*database.ReceiptEntity, error) {
	var receipts []*database.ReceiptEntity
	if err := database.DB.Select(&receipts, "SELECT * FROM receipts WHERE sid = ?;", sessionId); err != nil {
		return nil, err
	}
	return receipts, nil
}

func InsertReceiptTx(tx *sqlx.Tx, receipt database.ReceiptEntity) error {
	if _, err := tx.Exec(
		"INSERT INTO receipts(rid, name, original_filename, filename, sid, total_price, unit, type, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
		receipt.ReceiptId, receipt.Name, receipt.OriginalFilename, receipt.Filename,
		receipt.SessionId, receipt.TotalPrice, receipt.Unit, receipt.Type,
		receipt.Width, receipt.Height); err != nil {
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

func InsertReceiptItemBoxTx(tx *sqlx.Tx, box database.ReceiptItemBoxEntity) error {
	if _, err := tx.Exec(
		"INSERT INTO receipt_item_boxes(ribid, rid, text, top, `left`, width, height) VALUES (?, ?, ?, ?, ?, ?, ?);",
		box.ReceiptItemBoxId, box.ReceiptId, box.Text, box.Top, box.Left, box.Width, box.Height); err != nil {
		return err
	}
	return nil
}

func GetReceiptItemBoxes(receiptId string) ([]database.ReceiptItemBoxEntity, error) {
	var boxes []database.ReceiptItemBoxEntity
	if err := database.DB.Select(&boxes, "SELECT * FROM receipt_item_boxes WHERE rid = ?;", receiptId); err != nil {
		return nil, err
	}
	return boxes, nil
}

func InsertReceiptItemTx(tx *sqlx.Tx, item database.ReceiptItemEntity) error {
	if _, err := tx.Exec(
		"INSERT INTO receipt_items(riid, rid, label, label_box_id, price, price_box_id) VALUES (?, ?, ?, ?, ?, ?);",
		item.ReceiptItemId, item.ReceiptId, item.Label, item.LabelBoxId, item.Price, item.PriceBoxId); err != nil {
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