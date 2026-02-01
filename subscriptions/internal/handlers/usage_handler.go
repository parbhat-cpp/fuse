package handlers

import (
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/services"
)

type UsageHandler struct {
	s *services.UsageService
}

func NewUsageHandler(s *services.UsageService) *UsageHandler {
	return &UsageHandler{
		s: s,
	}
}

func (h *UsageHandler) GetCurrentUsage(ctx echo.Context) error {
	user_id := ctx.Request().Header.Get("X-User-ID")

	res, err := h.s.GetCurrentUsage(uuid.MustParse(user_id))

	if err != nil {
		return ctx.JSON(500, map[string]string{
			"error": err.Error(),
		})
	}

	return ctx.JSON(200, res)
}

func (h *UsageHandler) GetPreviousUsage(ctx echo.Context) error {
	user_id := ctx.Request().Header.Get("X-User-ID")

	res, err := h.s.GetPreviousUsage(uuid.MustParse(user_id))

	if err != nil {
		return ctx.JSON(500, map[string]string{
			"error": err.Error(),
		})
	}

	return ctx.JSON(200, res)
}

func (h *UsageHandler) GetPreviousSubscription(ctx echo.Context) error {
	user_id := ctx.Request().Header.Get("X-User-ID")

	res, err := h.s.GetPreviousSubscription(uuid.MustParse(user_id))

	if err != nil {
		return ctx.JSON(500, map[string]string{
			"error": err.Error(),
		})
	}

	return ctx.JSON(200, res)
}
