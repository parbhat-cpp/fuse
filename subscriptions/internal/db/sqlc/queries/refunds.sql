-- name: CreateNewRefund :one
INSERT INTO refunds (subscription_id, razorpay_payment_id, amount, user_id)
VALUES ($1, $2, $3, $4)
RETURNING (id, subscription_id, razorpay_payment_id, amount, created_at, updated_at);

-- name: GetRefundByPaymentID :one
SELECT id, subscription_id, razorpay_payment_id, amount, created_at, updated_at
FROM refunds WHERE razorpay_payment_id = $1;

-- name: GetRefundsByUserID :many
SELECT id, subscription_id, razorpay_payment_id, amount, created_at, updated_at
FROM refunds WHERE user_id = $1 ORDER BY created_at DESC;
