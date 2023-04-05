package logger

import "travel-ai/libs/color"

type Level string

const (
	NIL   = "NIL"
	TEST  = "TEST"
	DEBUG = "DEBUG"
	INFO  = "INFO"
	WARN  = "WARN"
	ERROR = "ERROR"
	FATAL = "FATAL"
)

func getLevelColor(level Level) color.Color {
	switch level {
	case NIL:
		return color.WHITE
	case TEST:
		return color.BLUE
	case DEBUG:
		return color.GREEN
	case INFO:
		return color.CYAN
	case WARN:
		return color.YELLOW
	case ERROR:
		return color.RED
	case FATAL:
		return color.RED_BOLD
	}
	return ""
}
