package main

import (
	"log"
	"net/http"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/config"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/db/sqlc"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/handlers"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/services"
)

// add better error handling
// define subscription schema
// set up routes for subscription v1

func main() {
	err := godotenv.Load()

	if err != nil {
		log.Fatalf("Cannot load .env: %s", err)
	}

	e := echo.New()

	dbPool := config.ConnectDB()
	defer dbPool.Close()

	query := sqlc.New(dbPool)

	// subscription v1 api
	apiV1 := e.Group("/subscription/v1")

	// access control: specifies if a user can access a resource based on their current subscription
	accessService := services.NewAccessService(query)
	accessHandler := handlers.NewAccessHandler(accessService)

	routes := []handlers.Route{}

	// add routes for subscription v1
	routes = append(routes, handlers.AccessRoutes(accessHandler)...)

	handlers.RegisterRoutes(apiV1, routes)

	// to check microservice health
	e.GET("/health", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello, World!")
	})
	e.Logger.Fatal(e.Start(":1323"))
}
