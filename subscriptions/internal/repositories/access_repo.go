package repositories

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AccessRepository struct {
	dbPool *pgxpool.Pool
}

func NewAccessRepository(dbPool *pgxpool.Pool) *AccessRepository {
	return &AccessRepository{
		dbPool: dbPool,
	}
}

func (r *AccessRepository) GetAccess() (string, error) {
	var access string
	err := r.dbPool.QueryRow(context.Background(), "SELECT access FROM access_table").Scan(&access)
	if err != nil {
		return "", err
	}
	return access, nil
}
