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
			ID:          cfg.SUBSCRIPTION_PLANS_ID["free"],
			Name:        "Free",
			Description: "Perfect for getting started — explore core features with limited access.",
			Price:       0,
			ValidMonths: -1, // forever
			Features: []string{
				"Create/Join rooms",
				"Schedule 3 meetings",
				"Limited room duration - 45 minutes",
				"Join 5 public rooms",
			},
			FeaturesJson: map[string]int{"room_duration": 45, "room_schedule_limit": 3, "public_room_join_limit": 5},
		},
		"basic": {
			ID:          cfg.SUBSCRIPTION_PLANS_ID["basic"],
			Name:        "Basic",
			Description: "Ideal for regular users who want more access, flexibility, and control.",
			Price:       149,
			ValidMonths: 1,
			Features: []string{
				"Features of Free Plan with additional access and limits",
				"Room duration extended to 75 minutes",
				"Schedule up to 10 meetings",
				"Join up to 25 public rooms",
			},
			FeaturesJson: map[string]int{"room_duration": 75, "room_schedule_limit": 10, "public_room_join_limit": 25},
		},
		"pro": {
			ID:          cfg.SUBSCRIPTION_PLANS_ID["pro"],
			Name:        "Pro",
			Description: "Built for power users — unlock full features, priority access, and maximum limits.",
			Price:       399,
			ValidMonths: 1,
			Features: []string{
				"Features of Free Plan with additional access and limits",
				"Room duration extended to 120 minutes",
				"Schedule up to 20 meetings",
				"Join unlimited public rooms",
			},
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
