package handlers

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/labstack/gommon/log"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/services"
)

type DeletionHandler struct {
	s *services.DeletionService
}

func NewDeletionHandler(s *services.DeletionService) *DeletionHandler {
	return &DeletionHandler{
		s: s,
	}
}

func (h *DeletionHandler) DeleteUserData(ctx echo.Context) error {
	user_id := ctx.Param("user_id")
	user_uuid := uuid.MustParse(user_id)

	if user_id == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid user ID")
	}

	err := h.s.DeleteUserData(user_uuid)

	if err != nil {
		log.Errorf("%s", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to delete user data")
	}

	return ctx.JSON(http.StatusOK, map[string]string{
		"message": "User data deleted successfully",
	})
}
