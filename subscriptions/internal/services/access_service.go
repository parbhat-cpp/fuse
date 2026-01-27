package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/parbhat-cpp/fuse/subscriptions/constants"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/config"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/db/sqlc"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/types"
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
	PlanUsage   interface{}
	IsAllowed   bool
	LimitLeft   int
	PlanExpired bool
}

type UsageResponse struct {
	Plan      constants.Plan
	PlanUsage interface{}
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
	 * - based on plan type, check the access request
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

		var usage = json.RawMessage(`{"room_schedule_quota": 0, "public_room_quota": 0}`)
		var limit int

		if access_request == constants.AccessTypeJoinRoom {
			usage = json.RawMessage(`{"room_schedule_quota": 0, "public_room_quota": 1}`)
			limit = freePlan.FeaturesJson["public_room_join_limit"] - 1
		}

		if access_request == constants.AccessTypeSchedule {
			usage = json.RawMessage(`{"room_schedule_quota": 1, "public_room_quota": 0}`)
			limit = freePlan.FeaturesJson["room_schedule_limit"] - 1
		}

		new_sub_usage_row, err := s.query.CreateSubscriptionUsage(context.Background(), sqlc.CreateSubscriptionUsageParams{
			UserID: user_uuid,
			ValidFrom: pgtype.Timestamptz{
				Time:  time.Now(),
				Valid: true,
			},
			ValidUntil: pgtype.Timestamptz{
				Time:  time.Now().AddDate(0, 0, 30),
				Valid: true,
			},
			Column4: string(usage), // Usage column sqlc generated it as Column4
		})

		if err != nil {
			return nil, fmt.Errorf("Unable to create new subsciption usage record")
		}

		if plan_expired {
			return &AccessResponse{Plan: freePlan, PlanUsage: user_usage, IsAllowed: true, LimitLeft: limit, PlanExpired: true}, nil
		}

		return &AccessResponse{Plan: freePlan, PlanUsage: new_sub_usage_row, IsAllowed: true, LimitLeft: limit, PlanExpired: false}, nil
	}

	if strings.ToLower(user_subscription.PlanType) == "basic" {
		basicPlan, _ := constants.GetPlans()["basic"]
		usage, _ := utils.ConvertBytesToMapType[types.Usage](user_usage.Usage)

		if access_request == constants.AccessTypeJoinRoom {
			if usage.PublicRoomQuota >= basicPlan.FeaturesJson["public_room_join_limit"] {
				return &AccessResponse{Plan: &basicPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Public Room Joining Quota is exhausted")
			} else {
				usage.PublicRoomQuota = usage.PublicRoomQuota + 1
				limit := basicPlan.FeaturesJson["public_room_join_limit"] - usage.PublicRoomQuota
				usage_json_byte, err := utils.ConvertMapTypeToBytes[*types.Usage](usage)

				if err != nil {
					return &AccessResponse{Plan: &basicPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Cannot create json bytes %s", err)
				}

				s.query.UpdateSubscriptionUsage(context.Background(), sqlc.UpdateSubscriptionUsageParams{ID: user_usage.ID, UserID: user_uuid, Column3: string(usage_json_byte)})

				return &AccessResponse{Plan: &basicPlan, IsAllowed: true, LimitLeft: limit, PlanExpired: false}, nil
			}
		}

		if access_request == constants.AccessTypeSchedule {
			if usage.RoomSchedulingQuota >= basicPlan.FeaturesJson["room_schedule_limit"] {
				return &AccessResponse{Plan: &basicPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Scheduling Room Quota is exhausted")
			} else {
				usage.RoomSchedulingQuota = usage.RoomSchedulingQuota + 1
				limit := basicPlan.FeaturesJson["room_schedule_limit"] - usage.RoomSchedulingQuota
				usage_json_byte, err := utils.ConvertMapTypeToBytes[*types.Usage](usage)

				if err != nil {
					return &AccessResponse{Plan: &basicPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Cannot convert maps to bytes %s", err)
				}
				s.query.UpdateSubscriptionUsage(context.Background(), sqlc.UpdateSubscriptionUsageParams{ID: user_usage.ID, UserID: user_uuid, Column3: string(usage_json_byte)})

				return &AccessResponse{Plan: &basicPlan, IsAllowed: true, LimitLeft: limit, PlanExpired: false}, nil
			}
		}
	}

	if strings.ToLower(user_subscription.PlanType) == "pro" {
		proPlan, _ := constants.GetPlans()["pro"]
		usage, _ := utils.ConvertBytesToMapType[types.Usage](user_usage.Usage)

		if access_request == constants.AccessTypeJoinRoom {
			if usage.PublicRoomQuota >= proPlan.FeaturesJson["public_room_join_limit"] {
				return &AccessResponse{Plan: &proPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Public Room Joining Quota is exhausted")
			} else {
				usage.PublicRoomQuota = usage.PublicRoomQuota + 1
				limit := proPlan.FeaturesJson["public_room_join_limit"] - usage.PublicRoomQuota
				usage_json_byte, err := utils.ConvertMapTypeToBytes[*types.Usage](usage)

				if err != nil {
					return &AccessResponse{Plan: &proPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Cannot convert maps to byte %s", err)
				}
				s.query.UpdateSubscriptionUsage(context.Background(), sqlc.UpdateSubscriptionUsageParams{ID: user_usage.ID, UserID: user_uuid, Column3: string(usage_json_byte)})

				return &AccessResponse{Plan: &proPlan, IsAllowed: true, LimitLeft: limit, PlanExpired: false}, nil
			}
		}

		if access_request == constants.AccessTypeSchedule {
			if usage.RoomSchedulingQuota >= proPlan.FeaturesJson["room_schedule_limit"] {
				return &AccessResponse{Plan: &proPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Scheduling Room Quota is exhausted")
			} else {
				usage.RoomSchedulingQuota = usage.RoomSchedulingQuota + 1
				limit := proPlan.FeaturesJson["room_schedule_limit"] - usage.RoomSchedulingQuota
				usage_json_byte, err := utils.ConvertMapTypeToBytes[*types.Usage](usage)

				if err != nil {
					return &AccessResponse{Plan: &proPlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Failed to convert usage map to bytes %s", err)
				}

				s.query.UpdateSubscriptionUsage(context.Background(), sqlc.UpdateSubscriptionUsageParams{ID: user_usage.ID, UserID: user_uuid, Column3: string(usage_json_byte)})

				return &AccessResponse{Plan: &proPlan, IsAllowed: true, LimitLeft: limit, PlanExpired: false}, nil
			}
		}
	}

	freePlan, _ := constants.GetPlans()["free"]
	usage, err := utils.ConvertBytesToMapType[types.Usage](user_usage.Usage)

	if err != nil {
		return &AccessResponse{Plan: &freePlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Cannot convert usage bytes to map %s", err)
	}

	if access_request == constants.AccessTypeJoinRoom {
		if usage.PublicRoomQuota >= freePlan.FeaturesJson["public_room_join_limit"] {
			return &AccessResponse{Plan: &freePlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Public Room Joining Quota is exhausted")
		} else {
			usage.PublicRoomQuota = usage.PublicRoomQuota + 1
			limit := freePlan.FeaturesJson["public_room_join_limit"] - usage.PublicRoomQuota

			usage_json_byte, err := utils.ConvertMapTypeToBytes[*types.Usage](usage)

			if err != nil {
				return &AccessResponse{Plan: &freePlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Cannot convert maps to byte %s", err)
			}
			updated_row, err := s.query.UpdateSubscriptionUsage(context.Background(), sqlc.UpdateSubscriptionUsageParams{ID: user_usage.ID, UserID: user_uuid, Column3: string(usage_json_byte)})

			if err != nil {
				return &AccessResponse{Plan: &freePlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Failed to update subscription usage %s", err)
			}

			return &AccessResponse{Plan: &freePlan, PlanUsage: updated_row, IsAllowed: true, LimitLeft: limit, PlanExpired: false}, nil
		}
	}

	if access_request == constants.AccessTypeSchedule {
		if usage.RoomSchedulingQuota >= freePlan.FeaturesJson["room_schedule_limit"] {
			return &AccessResponse{Plan: &freePlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Scheduling Room Quota is exhausted")
		} else {
			usage.RoomSchedulingQuota = usage.RoomSchedulingQuota + 1
			limit := freePlan.FeaturesJson["room_schedule_limit"] - usage.RoomSchedulingQuota
			usage_json_byte, err := utils.ConvertMapTypeToBytes(usage)

			if err != nil {
				return &AccessResponse{Plan: &freePlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Failed to convert usage map to bytes %s", err)
			}

			updated_row, err := s.query.UpdateSubscriptionUsage(context.Background(), sqlc.UpdateSubscriptionUsageParams{ID: user_usage.ID, UserID: user_uuid, Column3: string(usage_json_byte)})

			if err != nil {
				return &AccessResponse{Plan: &freePlan, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Failed to update subscription usage %s", err)
			}

			return &AccessResponse{Plan: &freePlan, PlanUsage: updated_row, IsAllowed: true, LimitLeft: limit, PlanExpired: false}, nil
		}
	}

	return &AccessResponse{Plan: &constants.Plan{}, IsAllowed: false, LimitLeft: 0, PlanExpired: false}, fmt.Errorf("Invalid access request type")
}
