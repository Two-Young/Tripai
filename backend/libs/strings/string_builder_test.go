package strings

import (
	"fmt"
	"testing"
)

func TestNewStringBuilder(t *testing.T) {
	finalString := "Hello World!"
	newStringBuilder := NewStringBuilder()

	newStringBuilder.Append("Hello")
	newStringBuilder.Space()
	newStringBuilder.Append("World!")

	formattedString := newStringBuilder.Build()

	if finalString != formattedString {
		t.Error()
	}
}

func TestCustomStringBuilder(t *testing.T) {
	newStringBuilder := NewStringBuilder()

	object := map[string]interface{}{"a": 15, "b": 35}
	newStringBuilder.Append(object)
	formattedString := newStringBuilder.Build()

	fmt.Println(formattedString)
}
