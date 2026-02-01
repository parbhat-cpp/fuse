package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/db/sqlc"
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
		return sqlc.GetCurrentSubscriptionUsageWithSubscriptionByUserIDRow{}, err
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
