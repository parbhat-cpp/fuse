package middlewares

import (
	"log"

	"github.com/labstack/echo/v4"
)

func PanicRecoveryMiddleware(nextHandler echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		if r := recover(); r != nil {
			log.Printf("Panic recovered: %v", r)
			return c.JSON(500, map[string]string{
				"error": "Internal Server Error: " + r.(string),
			})
		}
		return nextHandler(c)
	}
}
