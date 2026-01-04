package handlers

func AccessRoutes(h *AccessHandler) []Route {
	return []Route{
		{
			Method:  "GET",
			Path:    "/access",
			Handler: h.HandleAccessRequest,
		},
	}
}
