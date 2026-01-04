package handlers

import "github.com/labstack/echo/v4"

type Route struct {
	Method  string
	Path    string
	Handler echo.HandlerFunc
}

func RegisterRoutes(e *echo.Group, routes []Route) {
	for _, route := range routes {
		e.Add(route.Method, route.Path, route.Handler)
	}
}
