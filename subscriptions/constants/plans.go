package constants

import (
	"errors"

	"github.com/google/uuid"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/config"
)

type Plan struct {
	ID           uuid.UUID
	Name         string
	Description  string
	Price        float64 // in INR
	ValidMonths  int
	Features     []string
	FeaturesJson map[string]int
}

func GetPlans() map[string]Plan {
	cfg := config.LoadEnv()

	var plans = map[string]Plan{
		"free": {
			ID:           cfg.SUBSCRIPTION_PLANS_ID["free"],
			Name:         "Free",
			Description:  "Free plan",
			Price:        0,
			ValidMonths:  -1, // forever
			Features:     []string{"Feature 1", "Feature 2"},
			FeaturesJson: map[string]int{"room_duration": 45, "room_schedule_limit": 3, "public_room_join_limit": 5},
		},
		"basic": {
			ID:           cfg.SUBSCRIPTION_PLANS_ID["basic"],
			Name:         "Basic",
			Description:  "Basic plan",
			Price:        149,
			ValidMonths:  1,
			Features:     []string{"Feature 1", "Feature 2", "Feature 3"},
			FeaturesJson: map[string]int{"room_duration": 75, "room_schedule_limit": 10, "public_room_join_limit": 25},
		},
		"pro": {
			ID:           cfg.SUBSCRIPTION_PLANS_ID["pro"],
			Name:         "Pro",
			Description:  "Pro plan",
			Price:        399,
			ValidMonths:  1,
			Features:     []string{"Feature 1", "Feature 2", "Feature 3"},
			FeaturesJson: map[string]int{"room_duration": 120, "room_schedule_limit": 20, "public_room_join_limit": -1},
		},
	}

	return plans
}

func GetPlanByID(id uuid.UUID) (*Plan, error) {
	plans := GetPlans()

	for _, plan := range plans {
		if plan.ID == id {
			return &plan, nil
		}
	}
	return nil, errors.New("plan not found")
}
