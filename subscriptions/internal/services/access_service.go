package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/parbhat-cpp/fuse/subscriptions/constants"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/config"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/db/sqlc"
	"github.com/parbhat-cpp/fuse/subscriptions/pkg/utils"
)

type AccessService struct {
	query *sqlc.Queries
}

func NewAccessService(query *sqlc.Queries) *AccessService {
	return &AccessService{
		query: query,
	}
}

type AccessResponse struct {
	Plan        *constants.Plan
	IsAllowed   bool
	LimitLeft   int
	PlanExpired bool
}

/**
 * Checks if the user with the given ID has access to the requested access type based on their subscription plan.
 * @param user_id: uuid.UUID
 * @param access_request: constants.AccessType
 * @return AccessResponse, error
 */
func (s *AccessService) HandleAccessRequest(user_id uuid.UUID, access_request constants.AccessType) (*AccessResponse, error) {
	/*
	 * 1. when user is new, no rows in subscription and subscription_usage table
	 * - create subscription_usage record with default values (free plan)
	 * - check the access request against the free plan
	 *
	 * 2. when user has a subscription
	 * - check if subscription is active
	 * - based on plan type, check if the access request
	 */
	var cfg = config.LoadEnv()

	var user_uuid pgtype.UUID = utils.ConvertGoogleUUIDToPgtypeUUID(user_id)

	// returns latest user subscription
	user_subscription, sub_err := s.query.GetSubscriptionByUserID(context.Background(), user_uuid)
	user_usage, usage_err := s.query.GetSubscriptionUsageByID(context.Background(), user_uuid)

	plan_expired := user_usage.ID.Valid && user_usage.ValidUntil.Valid && user_usage.ValidUntil.Time.Before(time.Now())

	// user's subscription not found create a new one or when free plan month is over
	// or when user's subscription is expired then create a free plan for them
	if (sub_err != nil && usage_err != nil) ||
		(!user_usage.SubscriptionID.Valid && user_usage.ValidUntil.Valid && user_usage.ValidUntil.Time.Before(time.Now())) ||
		(plan_expired) {
		freePlan, _ := constants.GetPlanByID(cfg.SUBSCRIPTION_PLANS_ID["free"])
		var usage []byte = []byte(`{"room_schedule_quota": 0, "public_room_quota": 0}`)
		var limit int

		if access_request == constants.AccessTypeJoinRoom {
			usage = []byte(`{"room_schedule_quota": 0, "public_room_quota": 1}`)
			limit = freePlan.FeaturesJson["public_room_join_limit"].(int) - 1
		}

		if access_request == constants.AccessTypeSchedule {
			usage = []byte(`{"room_schedule_quota": 1, "public_room_quota": 0}`)
			limit = freePlan.FeaturesJson["room_schedule_limit"].(int) - 1
		}

		fmt.Printf("%s", usage)

		_, err := s.query.CreateSubscriptionUsage(context.Background(), sqlc.CreateSubscriptionUsageParams{
			UserID: user_uuid,
			ValidFrom: pgtype.Timestamptz{
				Time: time.Now(),
			},
			ValidUntil: pgtype.Timestamptz{
				Time: time.Now().AddDate(0, 0, 30),
			},
			Usage: usage,
		})

		if err != nil {
			return nil, fmt.Errorf("Unable to create new subsciption usage record")
		}

		if plan_expired {
			return &AccessResponse{Plan: freePlan, IsAllowed: true, LimitLeft: limit, PlanExpired: true}, nil
		}

		return &AccessResponse{Plan: freePlan, IsAllowed: true, LimitLeft: limit, PlanExpired: false}, nil
	}

	if user_subscription.PlanType == "basic" {
		basicPlan, _ := constants.GetPlanByID(cfg.SUBSCRIPTION_PLANS_ID["basic"])
		usage, _ := utils.ConvertBytesToMap(user_usage.Usage)

		if access_request == constants.AccessTypeJoinRoom {
			if usage["public_room_quota"].(int) >= basicPlan.FeaturesJson["public_room_join_limit"].(int) {
				return &AccessResponse{Plan: basicPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Public Room Joining Quota is exhausted")
			} else {
				usage["public_room_quota"] = usage["public_room_quota"].(int) + 1
				limit := basicPlan.FeaturesJson["public_room_join_limit"].(int) - usage["public_room_quota"].(int)
				usage_json_byte, err := utils.ConvertMapToBytes(usage)

				if err != nil {
					return &AccessResponse{Plan: basicPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Cannot create json bytes", err)
				}

				// usage_json := []byte(`{"public_room_quota":` + strconv.Itoa(usage["public_room_quota"].(int)+1) + `, "room_scheduling_quota":` + strconv.Itoa(usage["room_scheduling_quota"].(int)) + `}`)
				s.query.UpdateSubscriptionUsage(context.Background(), sqlc.UpdateSubscriptionUsageParams{SubscriptionID: user_subscription.ID, UserID: user_uuid, Usage: usage_json_byte})

				return &AccessResponse{Plan: basicPlan, IsAllowed: true, LimitLeft: limit, PlanExpired: false}, nil
			}
		}

		if access_request == constants.AccessTypeSchedule {
			if usage["room_scheduling_quota"].(int) >= basicPlan.FeaturesJson["room_schedule_limit"].(int) {
				return &AccessResponse{Plan: basicPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Scheduling Room Quota is exhausted")
			} else {
				usage["room_scheduling_quota"] = usage["room_scheduling_quota"].(int) + 1
				limit := basicPlan.FeaturesJson["room_schedule_limit"].(int) - usage["room_scheduling_quota"].(int)
				usage_json_byte, err := utils.ConvertMapToBytes(usage)

				if err != nil {
					return &AccessResponse{Plan: basicPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Cannot convert maps to bytes", err)
				}
				// usage_json := []byte(`{"public_room_quota":` + strconv.Itoa(usage["public_room_quota"].(int)) + `, "room_scheduling_quota":` + strconv.Itoa(usage["room_scheduling_quota"].(int)+1) + `}`)
				s.query.UpdateSubscriptionUsage(context.Background(), sqlc.UpdateSubscriptionUsageParams{SubscriptionID: user_subscription.ID, UserID: user_uuid, Usage: usage_json_byte})

				return &AccessResponse{Plan: basicPlan, IsAllowed: true, LimitLeft: limit, PlanExpired: false}, nil
			}
		}
	}

	if user_subscription.PlanType == "pro" {
		proPlan, _ := constants.GetPlanByID(cfg.SUBSCRIPTION_PLANS_ID["pro"])
		usage, _ := utils.ConvertBytesToMap(user_usage.Usage)

		if access_request == constants.AccessTypeJoinRoom {
			if usage["public_room_quota"].(int) >= proPlan.FeaturesJson["public_room_join_limit"].(int) {
				return &AccessResponse{Plan: proPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Public Room Joining Quota is exhausted")
			} else {
				usage["public_room_quota"] = usage["public_room_quota"].(int) + 1
				limit := proPlan.FeaturesJson["public_room_join_limit"].(int) - usage["public_room_quota"].(int)
				usage_json_byte, err := utils.ConvertMapToBytes(usage)

				if err != nil {
					return &AccessResponse{Plan: proPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Cannot convert maps to byte", err)
				}
				// usage_json := []byte(`{"public_room_quota":` + strconv.Itoa(usage["public_room_quota"].(int)+1) + `, "room_scheduling_quota":` + strconv.Itoa(usage["room_scheduling_quota"].(int)) + `}`)
				s.query.UpdateSubscriptionUsage(context.Background(), sqlc.UpdateSubscriptionUsageParams{SubscriptionID: user_subscription.ID, UserID: user_uuid, Usage: usage_json_byte})

				return &AccessResponse{Plan: proPlan, IsAllowed: true, LimitLeft: limit, PlanExpired: false}, nil
			}
		}

		if access_request == constants.AccessTypeSchedule {
			if usage["room_scheduling_quota"].(int) >= proPlan.FeaturesJson["room_schedule_limit"].(int) {
				return &AccessResponse{Plan: proPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Scheduling Room Quota is exhausted")
			} else {
				usage["room_scheduling_quota"] = usage["room_scheduling_quota"].(int) + 1
				limit := proPlan.FeaturesJson["room_schedule_limit"].(int) - usage["room_scheduling_quota"].(int)

				usage_json_byte, err := utils.ConvertMapToBytes(usage)

				if err != nil {
					return &AccessResponse{Plan: proPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Failed to convert usage map to bytes", err)
				}

				// usage_json := []byte(`{"public_room_quota":` + strconv.Itoa(usage["public_room_quota"].(int)) + `, "room_scheduling_quota":` + strconv.Itoa(usage["room_scheduling_quota"].(int)+1) + `}`)
				s.query.UpdateSubscriptionUsage(context.Background(), sqlc.UpdateSubscriptionUsageParams{SubscriptionID: user_subscription.ID, UserID: user_uuid, Usage: usage_json_byte})

				return &AccessResponse{Plan: proPlan, IsAllowed: true, LimitLeft: limit, PlanExpired: false}, nil
			}
		}
	}

	return &AccessResponse{Plan: &constants.Plan{}, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Invalid access request type")
}
