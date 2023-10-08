package socket

import (
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"travel-ai/util"
)

func BindJson(src interface{}, dest interface{}) error {
	var bytes []byte
	var err error

	switch v := src.(type) {
	case string:
		bytes = []byte(v)
	default:
		bytes, err = json.Marshal(src)
		if err != nil {
			return err
		}
	}

	raw := make(map[string]interface{})
	if err := json.Unmarshal(bytes, &raw); err != nil {
		return err
	}

	v := reflect.ValueOf(dest).Elem()
	for i := 0; i < v.NumField(); i++ {
		field := v.Type().Field(i)
		jsonTag := field.Tag.Get("json")
		bindingTag := field.Tag.Get("binding")

		if jsonTag == "-" {
			continue
		}

		if rawValue, ok := raw[jsonTag]; ok && rawValue != nil {
			var innerDest interface{}
			kind := field.Type.Kind()
			rawValueType := reflect.TypeOf(rawValue)

			switch kind {
			case reflect.Map, reflect.Struct:
				// Handle the case where the field is a pointer type
				innerDest = reflect.New(field.Type).Interface()
				if err := BindJson(rawValue, innerDest); err != nil {
					return err
				}
				rawValue = reflect.ValueOf(innerDest).Elem().Interface()
				v.Field(i).Set(reflect.ValueOf(rawValue))
				break
			case reflect.Ptr:
				// If rawValue is not nil, then set the field with the address of rawValue
				if rawValueType.AssignableTo(field.Type.Elem()) {
					newValue := reflect.New(field.Type.Elem())
					newValue.Elem().Set(reflect.ValueOf(rawValue))
					v.Field(i).Set(newValue)
				}
				break
			default:
				// type check
				if rawValue != nil && reflect.TypeOf(rawValue) != field.Type {
					// but allow number to number
					if util.IsNumber(rawValue) && util.IsNumberType(field.Type) {
						rawValue = reflect.ValueOf(rawValue).Convert(field.Type).Interface()
					} else {
						return fmt.Errorf("[BindError] type mismatch for field '%v' (%v) <- input '%v' (%v)",
							field.Name, field.Type, rawValue, rawValueType)
					}
				}
				v.Field(i).Set(reflect.ValueOf(rawValue))
				break
			}
		} else if bindingTag == "required" {
			return errors.New("[BindError] missing value for field: " + field.Name)
		} else {
			// set default value
			v.Field(i).Set(reflect.Zero(field.Type))
		}
	}

	return nil
}
