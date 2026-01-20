package handlers

func PaymentRoutes(h *PaymentHandler) []Route {
	return []Route{
		{
			Method:  "GET",
			Path:    "/payment/initialize",
			Handler: h.InitializePayment,
		},
		{
			Method:  "POST",
			Path:    "/payment/verify",
			Handler: h.VerifyPayment,
		},
		{
			Method:  "GET",
			Path:    "/payment/plans",
			Handler: h.GetPlans,
		},
	}
}
