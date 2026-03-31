package handlers

import "net/http"

func DeletionRoutes(h *DeletionHandler) []Route {
	return []Route{
		{
			Method:  http.MethodDelete,
			Path:    "/delete/:user_id",
			Handler: h.DeleteUserData,
		},
	}
}
