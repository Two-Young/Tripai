package database

import (
	"errors"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"os"
)

var DB *sqlx.DB = nil

type DatabaseConfig struct {
	User         string
	Password     string
	Host         string
	Port         string
	DatabaseName string
}

func NewDatabaseConfig(user, pass, host, port, databaseName string) *DatabaseConfig {
	return &DatabaseConfig{
		User:         user,
		Password:     pass,
		Host:         host,
		Port:         port,
		DatabaseName: databaseName,
	}
}

func (d *DatabaseConfig) validate() error {
	if d.User == "" {
		return errors.New("user is required")
	}
	if d.Password == "" {
		return errors.New("password is required")
	}
	if d.Host == "" {
		return errors.New("host is required")
	}
	if d.Port == "" {
		return errors.New("port is required")
	}
	if d.DatabaseName == "" {
		return errors.New("database name is required")
	}
	return nil
}

func (d *DatabaseConfig) getEndpoint() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", d.User, d.Password, d.Host, d.Port, d.DatabaseName)
}

func Initialize() (db *sqlx.DB, err error) {
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	databaseName := os.Getenv("DB_NAME")

	databaseConfig := NewDatabaseConfig(user, password, host, port, databaseName)
	endpoint := databaseConfig.getEndpoint()

	db, err = sqlx.Open("mysql", endpoint)
	if err != nil {
		return nil, err
	}
	if err = db.Ping(); err != nil {
		return nil, errors.New("failed to connect database: " + err.Error())
	}
	DB = db
	return db, nil
}
