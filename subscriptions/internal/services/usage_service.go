package services

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/db/sqlc"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/types"
	"github.com/parbhat-cpp/fuse/subscriptions/pkg/utils"
)

type UsageService struct {
	query *sqlc.Queries
}

func NewUsageService(query *sqlc.Queries) *UsageService {
	return &UsageService{
		query: query,
	}
}

func (s *UsageService) GetCurrentUsage(user_id uuid.UUID) (sqlc.GetCurrentSubscriptionUsageWithSubscriptionByUserIDRow, error) {
	user_uuid := utils.ConvertGoogleUUIDToPgtypeUUID(user_id)

	usage_row, err := s.query.GetCurrentSubscriptionUsageWithSubscriptionByUserID(context.Background(), user_uuid)

	if err != nil {
		default_usage := types.Usage{
			PublicRoomQuota:     0,
			RoomSchedulingQuota: 0,
		}
		default_usage_json, err := json.Marshal(default_usage)
		if err != nil {
			return sqlc.GetCurrentSubscriptionUsageWithSubscriptionByUserIDRow{}, err
		}
		new_usage_row, err := s.query.CreateSubscriptionUsage(context.Background(), sqlc.CreateSubscriptionUsageParams{
			UserID: user_uuid,
			ValidFrom: pgtype.Timestamptz{
				Time:  time.Now(),
				Valid: true,
			},
			ValidUntil: pgtype.Timestamptz{
				Time:  time.Now().AddDate(0, 0, 30),
				Valid: true,
			},
			Column4: string(default_usage_json), // Usage column sqlc generated it as Column4
		})

		return sqlc.GetCurrentSubscriptionUsageWithSubscriptionByUserIDRow{
			ID:         new_usage_row.ID,
			ValidFrom:  new_usage_row.ValidFrom,
			ValidUntil: new_usage_row.ValidUntil,
			Usage:      new_usage_row.Usage,
			PlanType:   "Free",
		}, err
	}

	return usage_row, nil
}

func (s *UsageService) GetPreviousUsage(user_id uuid.UUID) ([]sqlc.GetAllSubscriptionUsageWithSubscriptionRow, error) {
	user_uuid := utils.ConvertGoogleUUIDToPgtypeUUID(user_id)

	usage_rows, err := s.query.GetAllSubscriptionUsageWithSubscription(context.Background(), user_uuid)

	if err != nil {
		return nil, err
	}

	return usage_rows, nil
}

func (s *UsageService) GetPreviousSubscription(user_id uuid.UUID) ([]sqlc.GetAllSubscriptionsRow, error) {
	user_uuid := utils.ConvertGoogleUUIDToPgtypeUUID(user_id)

	subscription_rows, err := s.query.GetAllSubscriptions(context.Background(), user_uuid)

	if err != nil {
		return nil, err
	}

	return subscription_rows, nil
}
