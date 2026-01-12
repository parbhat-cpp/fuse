package handlers

import (
	"errors"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/parbhat-cpp/fuse/subscriptions/constants"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/services"
)

type AccessHandler struct {
	s *services.AccessService
}

func NewAccessHandler(accessService *services.AccessService) *AccessHandler {
	return &AccessHandler{
		s: accessService,
	}
}

func (h *AccessHandler) HandleAccessRequest(ctx echo.Context) error {
	user_id := uuid.MustParse(ctx.QueryParam("user_id"))
	access_request := constants.AccessType(ctx.QueryParam("access_request"))

	if user_id == uuid.Nil {
		return errors.New("user_id is required")
	}

	if access_request == "" {
		return errors.New("access_request is required")
	}

	if access_request != constants.AccessTypeJoinRoom && access_request != constants.AccessTypeSchedule {
		return errors.New("invalid access_request")
	}

	res, err := h.s.HandleAccessRequest(user_id, access_request)

	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}
	return ctx.JSON(http.StatusOK, res)
}
