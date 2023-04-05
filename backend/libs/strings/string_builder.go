package strings

import (
	"fmt"
	"reflect"
	"travel-ai/libs/color"
	"travel-ai/libs/console"
	MemJson "travel-ai/libs/json"
)

type StringBuilder struct {
	string     string
	marshaller MemJson.MarshalFunc
}

func NewStringBuilder() *StringBuilder {
	sb := new(StringBuilder)
	sb.marshaller = MemJson.Marshal
	return sb
}

func (sb *StringBuilder) SetMarshaller(marshalFunc MemJson.MarshalFunc) {
	sb.marshaller = marshalFunc
}

func (sb *StringBuilder) Append(object interface{}) *StringBuilder {
	if object == nil {
		sb.string += "[nil]"
		return sb
	} else if _, ok := object.(error); ok {
		sb.string += fmt.Sprintf("[error] %s", object.(error).Error())
		return sb
	}

	objectType := reflect.TypeOf(object)
	objectKind := objectType.Kind()
	//objectName := objectType.Name()

	var str string
	getMarshalledValue := func() string {
		marshaled, err := sb.marshaller(object)
		var objectValue string
		if err != nil {
			objectValue = "<Unable to parse>"
		} else {
			objectValue = string(marshaled)
		}
		return objectValue
	}

	switch objectKind {
	case reflect.String:
		str = object.(string)
	case reflect.Ptr:
		objectElem := objectType.Elem()
		objectTypeTag := console.Wrap("[*"+objectElem.Name()+"]", color.C_ORANGE)
		marshaled := getMarshalledValue()
		str = objectTypeTag + " " + marshaled
	default:
		objectTypeTag := console.Wrap("["+objectKind.String()+"]", color.C_ORANGE)
		marshaled := getMarshalledValue()
		str = objectTypeTag + " " + marshaled
	}

	sb.string += str
	return sb
}

func (sb *StringBuilder) Space() *StringBuilder {
	sb.string += " "
	return sb
}

func (sb *StringBuilder) Flush() *StringBuilder {
	sb.string += "\n"
	return sb
}

func (sb *StringBuilder) Tab() *StringBuilder {
	sb.string += "\t"
	return sb
}

func (sb *StringBuilder) Build() string {
	return sb.string
}
