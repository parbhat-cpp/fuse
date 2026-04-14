declare -A SERVICES=(
    ["backend"]="backend"
    ["frontend"]="frontend"
    ["notifications"]="notifications"
    ["subscriptions"]="subscriptions"
    ["auth"]="auth"
    ["workers/notifications/inapp"]="inapp-notifications-worker"
    ["workers/rooms/scheduler-worker"]="scheduler-worker"
    ["."]="nginx"
)
