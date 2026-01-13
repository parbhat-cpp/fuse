package config

import (
	razorpay "github.com/razorpay/razorpay-go"
)

func GetRazorpayClient() *razorpay.Client {
	cfg := LoadEnv()
	client := razorpay.NewClient(cfg.RAZORPAY_API_KEY, cfg.RAZORPAY_API_SECRET)
	return client
}
