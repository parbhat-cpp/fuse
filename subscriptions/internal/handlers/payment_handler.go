package handlers

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/parbhat-cpp/fuse/subscriptions/internal/services"
)

type PaymentHandler struct {
	s *services.PaymentService
}

type PaymentVerifyRequest struct {
	UserID            uuid.UUID `json:"user_id"`
	PlanType          string    `json:"plan_type"`
	OrderID           string    `json:"order_id"`
	RazorpayOrderID   string    `json:"razorpay_order_id"`
	RazorpayPaymentID string    `json:"razorpay_payment_id"`
	RazorpaySignature string    `json:"razorpay_signature"`
}

func NewPaymentHandler(s *services.PaymentService) *PaymentHandler {
	return &PaymentHandler{
		s: s,
	}
}

func (h *PaymentHandler) InitializePayment(ctx echo.Context) error {
	plan_type := ctx.QueryParam("plan_type")

	res, err := h.s.InitializePayment(plan_type)

	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}
	return ctx.JSON(http.StatusOK, res)
}

func (h *PaymentHandler) VerifyPayment(ctx echo.Context) error {
	req := new(PaymentVerifyRequest)

	if err := ctx.Bind(req); err != nil {
		return ctx.JSON(http.StatusBadRequest, map[string]string{
			"error": "invalid request payload",
		})
	}

	res, err := h.s.VerifyPayment(req.UserID, req.PlanType, req.OrderID, req.RazorpayOrderID, req.RazorpayPaymentID, req.RazorpaySignature)

	if err != nil {
		return ctx.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}
	return ctx.JSON(http.StatusOK, res)
}
