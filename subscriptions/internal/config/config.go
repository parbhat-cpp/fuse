package config

import (
	"os"

	"github.com/google/uuid"
)

type Config struct {
	DB_URL                string
	SUBSCRIPTION_PLANS_ID map[string]uuid.UUID
	PORT                  string
	RAZORPAY_API_KEY      string
	RAZORPAY_API_SECRET   string
	NOTIFICATION_URL      string
}

func LoadEnv() *Config {
	return &Config{
		DB_URL: os.Getenv("DB_URL"),

		SUBSCRIPTION_PLANS_ID: map[string]uuid.UUID{
			"free":  uuid.MustParse(os.Getenv("FREE_PLAN_ID")),
			"basic": uuid.MustParse(os.Getenv("BASIC_PLAN_ID")),
			"pro":   uuid.MustParse(os.Getenv("PRO_PLAN_ID")),
		},

		PORT: os.Getenv("PORT"),

		RAZORPAY_API_KEY:    os.Getenv("RAZORPAY_API_KEY"),
		RAZORPAY_API_SECRET: os.Getenv("RAZORPAY_API_SECRET"),

		NOTIFICATION_URL: os.Getenv("NOTIFICATION_URL"),
	}
}
