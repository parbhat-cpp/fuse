package handlers

import "github.com/parbhat-cpp/fuse/subscriptions/internal/services"

type PaymentHandler struct {
	s *services.PaymentService
}

func NewPaymentHandler(s *services.PaymentService) *PaymentHandler {
	return &PaymentHandler{
		s: s,
	}
}

func (h *PaymentHandler) HandlePayment(userID int64, amount float64) error {
	// return h.s.ProcessPayment(userID, amount)
	return nil
}
