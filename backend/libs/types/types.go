package types

import (
	"errors"
	"math"
	"reflect"
)

var (
	float64Type = reflect.TypeOf(float64(0))
)

func AsFloat64(unknown interface{}) (float64, error) {
	value := reflect.ValueOf(unknown)
	point := reflect.Indirect(value)

	if !point.Type().ConvertibleTo(float64Type) {
		return math.NaN(), errors.New("Can't convert " + point.Type().String() + " to float64")
	}

	floatValue := point.Convert(float64Type)
	return floatValue.Float(), nil
}

func AsType[T reflect.Type](unknown interface{}, _type T) (T, error) {
	value := reflect.ValueOf(unknown)
	point := reflect.Indirect(value)

	if !point.Type().ConvertibleTo(float64Type) {
		return _type, errors.New("Can't convert " + point.Type().String() + " to " + _type.String())
	}

	convertedVal := point.Convert(_type)
	return convertedVal.Interface().(T), nil
}
