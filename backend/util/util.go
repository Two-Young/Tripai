package util

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"time"
	"travel-ai/log"
)

func InterfaceToStruct(src interface{}, dst interface{}) error {
	jsonData, err := json.Marshal(src)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(jsonData, &dst); err != nil {
		return err
	}
	return nil
}

func ParseDuration(str string) (time.Duration, error) {
	// Duration string without last character (the unit)
	valueStr := str[:len(str)-1]

	// Parse the duration value as a float64
	value, err := strconv.ParseFloat(valueStr, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid duration string: %v", str)
	}

	// Get the duration unit (last character)
	unit := str[len(str)-1:]

	// Convert the duration value to a time.Duration based on the unit
	switch unit {
	case "c": // century
		return time.Duration(value * float64(time.Hour) * 24 * 365 * 100), nil
	case "y": // year
		return time.Duration(value * float64(time.Hour) * 24 * 365), nil
	case "w": // week
		return time.Duration(value * float64(time.Hour) * 24 * 7), nil
	case "d": // day
		return time.Duration(value * float64(time.Hour) * 24), nil
	case "h": // hour
		return time.Duration(value * float64(time.Hour)), nil
	case "m": // minute
		return time.Duration(value * float64(time.Minute)), nil
	case "s": // second
		return time.Duration(value * float64(time.Second)), nil
	case "ms": // millisecond
		return time.Duration(value * float64(time.Millisecond)), nil
	default:
		return 0, fmt.Errorf("unknown duration unit: %v", unit)
	}
}

func StructToReadable(src interface{}) *bytes.Buffer {
	jsonData, err := json.Marshal(src)
	if err != nil {
		log.Error(err)
		return nil
	}
	buffer := bytes.NewBuffer(jsonData)
	return buffer
}
