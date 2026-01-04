package config

import (
	"os"

	"github.com/google/uuid"
)

type Config struct {
	DB_URL string

	SUBSCRIPTION_PLANS_ID map[string]uuid.UUID
}

func LoadEnv() *Config {
	return &Config{
		DB_URL: os.Getenv("DB_URL"),

		SUBSCRIPTION_PLANS_ID: map[string]uuid.UUID{
			"free":  uuid.MustParse(os.Getenv("FREE_PLAN_ID")),
			"basic": uuid.MustParse(os.Getenv("BASIC_PLAN_ID")),
			"pro":   uuid.MustParse(os.Getenv("PRO_PLAN_ID")),
		},
	}
}
