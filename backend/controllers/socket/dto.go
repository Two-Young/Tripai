package socket

import (
	"encoding/json"
	"errors"
	"reflect"
)

type authenticateRequest struct {
	Token string `json:"token"`
}

func bindJson(src interface{}, dest any) error {
	bytes, err := json.Marshal(src)
	if err != nil {
		panic(err)
	}
	if err := json.Unmarshal(bytes, dest); err != nil {
		panic(err)
	}
	if err := isFullyBound(dest); err != nil {
		return err
	}
	return nil
}

func isFullyBound(dto interface{}) error {
	v := reflect.ValueOf(dto).Elem()

	for i := 0; i < v.NumField(); i++ {
		field := v.Type().Field(i)
		jsonTag := field.Tag.Get("json")

		if jsonTag == "-" {
			continue
		}

		if v.Field(i).IsZero() {
			return errors.New("[BindError] missing value for field: " + field.Name)
		}
	}
	return nil
}
