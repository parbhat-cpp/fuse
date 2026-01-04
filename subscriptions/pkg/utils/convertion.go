package utils

import (
	"encoding/json"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type dataMap map[string]interface{}

func ConvertGoogleUUIDToPgtypeUUID(u uuid.UUID) pgtype.UUID {
	return pgtype.UUID{
		Bytes: u,
		Valid: true,
	}
}

func ConvertBytesToMap(byteData []byte) (dataMap, error) {
	var result dataMap
	err := json.Unmarshal(byteData, &result)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func ConvertMapToBytes(data map[string]interface{}) ([]byte, error) {
	jsonBytes, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	return jsonBytes, nil
}
