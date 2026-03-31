package services

import (
	"context"
	"database/sql"
	"errors"
	"log"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/db/sqlc"
	"github.com/parbhat-cpp/fuse/subscriptions/pkg/utils"
)

type DeletionService struct {
	query *sqlc.Queries
	pool  *pgxpool.Pool
}

func NewDeletionService(query *sqlc.Queries, pool *pgxpool.Pool) *DeletionService {
	return &DeletionService{
		query: query,
		pool:  pool,
	}
}

func (s *DeletionService) DeleteUserData(user_id uuid.UUID) error {
	tx, err := s.pool.Begin(context.Background())
	user_id_pg := utils.ConvertGoogleUUIDToPgtypeUUID(user_id)

	if err != nil {
		return err
	}

	qtx := s.query.WithTx(tx)
	defer tx.Rollback(context.Background())

	_, err = qtx.RemoveRefundByUserID(context.Background(), user_id_pg)

	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			log.Printf("Error deleting refunds for user %s: %v", user_id, err)
			return err
		}
	}

	_, err = qtx.RemoveSubscriptionByUserID(context.Background(), user_id_pg)

	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			log.Printf("Error deleting subscriptions for user %s: %v", user_id, err)
			return err
		}
	}

	_, err = qtx.RemoveSubscriptionUsageByUserID(context.Background(), user_id_pg)

	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			log.Printf("Error deleting subscription usage for user %s: %v", user_id, err)
			return err
		}
	}

	err = tx.Commit(context.Background())

	if err != nil {
		log.Printf("Error committing transaction for user %s: %v", user_id, err)
		return err
	}

	return nil
}
