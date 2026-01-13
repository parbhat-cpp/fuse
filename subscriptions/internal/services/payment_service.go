package services

import (
	"context"
	"fmt"
	"math/big"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/parbhat-cpp/fuse/subscriptions/constants"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/config"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/db/sqlc"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/types"
	"github.com/parbhat-cpp/fuse/subscriptions/pkg/utils"
)

type PaymentService struct {
	query *sqlc.Queries
	db    *pgx.Conn
}

func NewPaymentService(query *sqlc.Queries, db *pgx.Conn) *PaymentService {
	return &PaymentService{
		query: query,
		db:    db,
	}
}

func (s *PaymentService) InitializePayment(plan_type string) (map[string]interface{}, error) {
	razorpay_client := config.GetRazorpayClient()

	plan_data, err := constants.GetPlanByID(uuid.MustParse(plan_type))

	if err != nil {
		return map[string]interface{}{}, fmt.Errorf("Invalid plan type")
	}

	order_data := map[string]interface{}{
		"amount":   plan_data.Price * 100, // amount in paise
		"currency": "INR",
		"receipt":  uuid.New().String(),
	}

	body, err := razorpay_client.Order.Create(order_data, nil)

	if err != nil {
		return map[string]interface{}{}, fmt.Errorf("Unable to create an order")
	}

	return body, nil
}

func (s *PaymentService) VerifyPayment(user_id uuid.UUID, plan_type string, order_id string, razorpay_order_id string, razorpay_payment_id string, razorpay_signature string) (interface{}, error) {
	cfg := config.LoadEnv()

	plan, err := constants.GetPlanByID(cfg.SUBSCRIPTION_PLANS_ID[plan_type])

	var user_uuid pgtype.UUID = utils.ConvertGoogleUUIDToPgtypeUUID(user_id)
	var plan_uuid pgtype.UUID = utils.ConvertGoogleUUIDToPgtypeUUID(plan.ID)
	var new_sub_valid_from pgtype.Timestamptz = pgtype.Timestamptz{Time: time.Now(), Valid: true}
	var new_sub_valid_to pgtype.Timestamptz = pgtype.Timestamptz{Time: time.Now().AddDate(0, 0, 30), Valid: true}
	var refund_flag bool = false
	var payment_verified bool = false
	var sub_id pgtype.UUID

	if err != nil {
		return nil, fmt.Errorf("Invalid plan type")
	}

	tx, err := s.db.Begin(context.Background())

	if err != nil {
		refund_flag = true
		return nil, fmt.Errorf("Failed to start a transaction")
	}

	qtx := s.query.WithTx(tx)
	defer func() {
		if payment_verified && refund_flag {
			_, err := s.refund(sub_id, user_uuid, razorpay_payment_id, int(plan.Price*100))
			if err != nil {
				fmt.Println("Refund failed: ", err)
			} else {
				fmt.Println("Refund successful for payment id: ", razorpay_payment_id)
			}
		}
	}()
	defer tx.Rollback(context.Background())

	payment_exists, _ := qtx.GetSubscriptionByPaymentID(context.Background(), razorpay_payment_id)

	if payment_exists.ID.Valid {
		return nil, fmt.Errorf("Subscription already exists for this payment")
	}

	err = utils.PaymentVerify(razorpay_signature, razorpay_order_id, razorpay_payment_id, cfg.RAZORPAY_API_SECRET)

	if err != nil {
		refund_flag = true
		return nil, err
	}
	payment_verified = true

	sub, err := qtx.GetSubscriptionByUserIDOrderID(context.Background(), sqlc.GetSubscriptionByUserIDOrderIDParams{UserID: user_uuid, OrderID: order_id})

	if err == nil {
		new_sub_valid_from.Time = sub.ValidUntil.Time.AddDate(0, 0, 1)
		new_sub_valid_from.Valid = true
		new_sub_valid_to.Time = new_sub_valid_from.Time.AddDate(0, 0, 30)
		new_sub_valid_to.Valid = true
	}

	sub_id = sub.ID

	sub_row, err := qtx.CreateSubscription(context.Background(), sqlc.CreateSubscriptionParams{
		UserID:            user_uuid,
		PlanID:            plan_uuid,
		PlanType:          plan.Name,
		OrderID:           order_id,
		PurchaseDate:      pgtype.Timestamptz{Time: time.Now(), Valid: true},
		ValidFrom:         new_sub_valid_from,
		ValidUntil:        new_sub_valid_to,
		RazorpayPaymentID: razorpay_payment_id,
		RazorpayOrderID:   razorpay_order_id,
		RazorpaySignature: razorpay_signature,
	})

	sub_id = sub_row.(sqlc.GetSubscriptionByIDRow).ID

	if err != nil {
		refund_flag = true
		return nil, fmt.Errorf("Unable to create subscription")
	}

	empty_usage := types.Usage{PublicRoomQuota: 0, RoomSchedulingQuota: 0}
	empty_usage_json, _ := utils.ConvertMapTypeToBytes(empty_usage)

	_, err = qtx.CreateSubscriptionUsage(context.Background(), sqlc.CreateSubscriptionUsageParams{
		UserID:     user_uuid,
		ValidFrom:  new_sub_valid_from,
		ValidUntil: new_sub_valid_to,
		Column4:    string(empty_usage_json),
	})

	if err != nil {
		refund_flag = true
		return nil, fmt.Errorf("Unable to create subscription usage")
	}

	err = tx.Commit(context.Background())

	if err != nil {
		refund_flag = true
		return nil, fmt.Errorf("Failed to commit transaction")
	}

	return sub_row, nil
}

func (s *PaymentService) refund(subscription_id pgtype.UUID, user_id pgtype.UUID, razorpay_payment_id string, amount int) (map[string]interface{}, error) {
	client := config.GetRazorpayClient()

	_, err := s.query.GetRefundByPaymentID(context.Background(), razorpay_payment_id)

	if err == nil {
		return nil, fmt.Errorf("Refund already processed for this payment")
	}

	data := map[string]interface{}{
		"speed": "normal",
		"notes": map[string]interface{}{},
	}
	body, err := client.Payment.Refund(razorpay_payment_id, amount, data, nil)

	if err != nil {
		return nil, err
	}

	s.query.CreateNewRefund(context.Background(), sqlc.CreateNewRefundParams{
		SubscriptionID:    subscription_id,
		RazorpayPaymentID: razorpay_payment_id,
		Amount:            pgtype.Numeric{Int: big.NewInt(int64(amount)), Valid: true},
		UserID:            user_id,
	})

	return body, nil
}
