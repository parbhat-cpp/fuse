-- name: CreateSubscription :one
INSERT INTO subscriptions (user_id, plan_id, plan_type, purchase_date, valid_from, order_id, valid_until, razorpay_payment_id, razorpay_order_id, razorpay_signature)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING id, user_id, plan_id, plan_type, purchase_date, valid_from, order_id, valid_until, razorpay_payment_id, razorpay_order_id, razorpay_signature;

-- name: GetAllSubscriptions :many
SELECT id, user_id, plan_id, plan_type, purchase_date, valid_from, order_id, valid_until, razorpay_payment_id, razorpay_order_id, razorpay_signature
FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC;

-- name: GetSubscriptionByUserID :one
SELECT id, user_id, plan_id, plan_type, purchase_date, valid_from, order_id, valid_until, razorpay_payment_id, razorpay_order_id, razorpay_signature
FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1;

-- name: GetSubscriptionByUserIDOrderID :one
SELECT id, user_id, plan_id, plan_type, purchase_date, valid_from, order_id, valid_until, razorpay_payment_id, razorpay_order_id, razorpay_signature
FROM subscriptions WHERE user_id = $1 AND order_id = $2 ORDER BY created_at DESC LIMIT 1;

-- name: GetSubscriptionByPaymentID :one
SELECT id, user_id, plan_id, plan_type, purchase_date, valid_from, order_id, valid_until, razorpay_payment_id, razorpay_order_id, razorpay_signature
FROM subscriptions WHERE razorpay_payment_id = $1;

-- name: GetSubscriptionByID :one
SELECT id, user_id, plan_id, plan_type, purchase_date, valid_from, order_id, valid_until, razorpay_payment_id, razorpay_order_id, razorpay_signature
FROM subscriptions WHERE id = $1 ORDER BY created_at DESC LIMIT 1;
