package strings

import "strings"

func Join(segments []string, delimiter string) string {
	return strings.Join(segments, delimiter)
}

func Split(string string, delimiter string) []string {
	return strings.Split(string, delimiter)
}
