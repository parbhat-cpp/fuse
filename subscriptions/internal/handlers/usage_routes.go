package handlers

func UsageRoutes(h *UsageHandler) []Route {
	return []Route{
		{
			Method:  "GET",
			Path:    "/usage/current",
			Handler: h.GetCurrentUsage,
		},
		{
			Method:  "GET",
			Path:    "/usage/previous",
			Handler: h.GetPreviousUsage,
		},
		{
			Method:  "GET",
			Path:    "/usage/previous-subscription",
			Handler: h.GetPreviousSubscription,
		},
	}
}
