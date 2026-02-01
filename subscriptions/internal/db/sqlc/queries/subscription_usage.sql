-- name: CreateSubscriptionUsage :one
INSERT INTO subscription_usage (user_id, valid_from, valid_until, usage, subscription_id)
VALUES ($1, $2, $3, $4::text::jsonb, $5)
RETURNING id, subscription_id, valid_from, valid_until, usage, subscription_id;

-- name: GetSubscriptionUsageByID :one
SELECT id, subscription_id, valid_from, valid_until, usage
FROM subscription_usage WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1;

-- name: GetCurrentSubscriptionUsageByUserID :one
SELECT id, subscription_id, valid_from, valid_until, usage
FROM subscription_usage WHERE user_id = $1 AND valid_from <= NOW() AND valid_until >= NOW() ORDER BY created_at DESC LIMIT 1;

-- name: GetCurrentSubscriptionUsageWithSubscriptionByUserID :one
SELECT su.id, su.valid_from, su.valid_until, su.usage, s.id AS subscription_id, s.plan_type
FROM subscription_usage AS su
INNER JOIN subscriptions AS s ON s.id = su.subscription_id 
WHERE su.user_id = $1 AND su.valid_from <= NOW() AND su.valid_until >= NOW() ORDER BY su.created_at DESC LIMIT 1;

-- name: GetAllSubscriptionUsage :many
SELECT id, subscription_id, valid_from, valid_until, usage
FROM subscription_usage WHERE user_id = $1 ORDER BY created_at DESC;

-- name: GetAllSubscriptionUsageWithSubscription :many
SELECT su.id, su.valid_from, su.valid_until, su.usage, s.id AS subscription_id, s.plan_type
FROM subscription_usage AS su
LEFT JOIN subscriptions AS s ON s.id = su.subscription_id 
WHERE su.user_id = $1 ORDER BY su.created_at DESC;

-- name: UpdateSubscriptionUsageDuration :one
UPDATE subscription_usage SET valid_from = $3, valid_until = $4
WHERE subscription_id = $1 AND user_id = $2
RETURNING id, subscription_id, valid_from, valid_until, usage;

-- name: UpdateSubscriptionUsage :one
UPDATE subscription_usage SET usage = $3::text::jsonb
WHERE id = $1 AND user_id = $2
RETURNING id, subscription_id, valid_from, valid_until, usage;
