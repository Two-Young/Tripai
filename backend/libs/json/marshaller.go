package json

import "encoding/json"

type MarshalFunc func(object any) (string, error)

func Marshal(object any) (string, error) {
	marshaled, err := json.Marshal(object)
	return string(marshaled), err
}

func PrettyMarshal(object any) (string, error) {
	marshaled, err := json.MarshalIndent(object, "", "\t")
	return string(marshaled), err
}

func Unmarshal(object string) (any, error) {
	var ref any
	encoded := []byte(object)
	err := json.Unmarshal(encoded, &ref)
	return ref, err
}
