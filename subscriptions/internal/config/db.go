package config

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

func ConnectDB() *pgxpool.Pool {
	cfg := LoadEnv()

	pool, err := pgxpool.New(context.Background(), cfg.DB_URL)

	if err != nil {
		log.Fatalf("Unable to connect Database: %v", err)
	}

	err = pool.Ping(context.Background())

	if err != nil {
		log.Fatalf("Database ping failed: %v", err)
	}
	log.Println("Database connected successfully")
	return pool
}
