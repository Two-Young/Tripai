package console

import (
	"fmt"
	"io"
	"travel-ai/libs/color"
)

func Print(content any) {
	fmt.Print(content)
}

func Println(content any) {
	fmt.Println(content)
}

func Fprintln(writer io.Writer, content ...any) (int, error) {
	return fmt.Fprintln(writer, content...)
}

func Printf(format string, params ...any) (int, error) {
	return fmt.Printf(format, params...)
}

func Errorf(format string, params ...any) error {
	return fmt.Errorf(format, params)
}

func Sprintf(format string, params ...interface{}) string {
	formatted := fmt.Sprintf(format, params...)
	return formatted
}

func Wrap(content string, _color color.Color) string {
	return string(_color) + content + string(color.RESET)
}

func Cprint(content string, _color color.Color) {
	Print(string(_color) + content + string(color.RESET))
}

func Cprintln(content string, _color color.Color) {
	Println(string(_color) + content + string(color.RESET))
}

func Cprintf(format string, _color color.Color, params ...interface{}) {
	formatted := fmt.Sprintf(format, params...)
	wrapped := Wrap(formatted, _color)
	Print(wrapped)
}

func Csprintf(format string, _color color.Color, params ...any) string {
	formatted := fmt.Sprintf(format, params...)
	wrapped := Wrap(formatted, _color)
	return wrapped
}
