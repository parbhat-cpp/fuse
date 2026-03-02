package lib

import (
	"bytes"
	"encoding/json"
	"net/http"

	"github.com/parbhat-cpp/fuse/subscriptions/internal/config"
)

func SendNotification(userID string, title string, message string, data map[string]interface{}, channels []string, templateID string) error {
	httpClient := &http.Client{}
	cfg := config.LoadEnv()

	body := map[string]interface{}{
		"user_id":     userID,
		"title":       title,
		"message":     message,
		"data":        data,
		"channels":    channels,
		"template_id": templateID,
	}

	request_body, err := json.Marshal(body)

	if err != nil {
		return err
	}

	_, err = httpClient.Post(
		cfg.NOTIFICATION_URL+"/notify",
		"application/json",
		bytes.NewBuffer(request_body),
	)

	if err != nil {
		return err
	}

	return nil
}
