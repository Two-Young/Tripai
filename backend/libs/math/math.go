package math

import (
	"errors"
	"math"
	"math/rand"
	"reflect"
	MemTypes "travel-ai/libs/types"
)

type Number interface {
	int | int8 | int16 | int32 | int64 |
	uint | uint8 | uint16 | uint32 |
	uint64 | float32 | float64
}

// Min Find minimum value of Number inputs
func Min(numbers ...interface{}) float64 {
	var pivot float64 = math.NaN()
	for _, number := range numbers {
		assertedNumber, err := MemTypes.AsFloat64(number)
		if err != nil {
			continue
		}
		if math.IsNaN(pivot) || assertedNumber < pivot {
			pivot = assertedNumber
		}
	}
	return pivot
}

func Max(numbers ...interface{}) float64 {
	var pivot float64 = math.NaN()
	for _, number := range numbers {
		assertedNumber, err := MemTypes.AsFloat64(number)
		if err != nil {
			continue
		}
		if math.IsNaN(pivot) || assertedNumber > pivot {
			pivot = assertedNumber
		}
	}
	return pivot
}

func MinInt(numbers ...interface{}) int {
	return int(Min(numbers...))
}

func MaxInt(numbers ...interface{}) int {
	return int(Max(numbers...))
}

func SafeMin(numbers ...interface{}) (interface{}, error) {
	if len(numbers) == 0 {
		return math.NaN(), errors.New("can't determine minimum value from empty slice")
	}

	pivot, err := MemTypes.AsFloat64(numbers[0])
	if err == nil {
		return pivot, err
	}

	numbers = numbers[1:]
	var numTypes []reflect.Type
	pIndex := 0
	for index, number := range numbers {
		numberType := reflect.TypeOf(number)
		numTypes = append(numTypes, numberType)

		assertedNumber := number.(float64)
		if assertedNumber < pivot {
			pivot = assertedNumber
			pIndex = index
		}
	}

	targetType := numTypes[pIndex]
	targetValue, _ := MemTypes.AsType(pivot, targetType)
	return targetValue, nil
}

func SafeMax(numbers ...interface{}) (float64, error) {
	if len(numbers) == 0 {
		return math.NaN(), errors.New("can't determine maximum value from empty slice")
	}

	pivot, err := MemTypes.AsFloat64(numbers[0])
	if err == nil {
		return pivot, err
	}

	numbers = numbers[1:]
	for _, number := range numbers {
		assertedNumber := number.(float64)
		if assertedNumber > pivot {
			pivot = assertedNumber
		}
	}
	return pivot, nil
}

func RandInt() int {
	return rand.Int()
}
