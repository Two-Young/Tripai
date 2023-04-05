package log

import logger2 "travel-ai/libs/logger"

var (
	GlobalLogger = logger2.NewBaseLoggerWithoutLabel()
)

func Test(args ...any) {
	GlobalLogger.Test(args...)
}

func Debug(args ...any) {
	GlobalLogger.Debug(args...)
}

func Info(args ...any) {
	GlobalLogger.Info(args...)
}

func Warn(args ...any) {
	GlobalLogger.Warn(args...)
}

func Error(args ...any) {
	GlobalLogger.Error(args...)
}

func Fatal(args ...any) {
	GlobalLogger.Fatal(args...)
}

func Testf(format string, args ...any) {
	GlobalLogger.Testf(format, args...)
}

func Debugf(format string, args ...any) {
	GlobalLogger.Debugf(format, args...)
}

func Infof(format string, args ...any) {
	GlobalLogger.Infof(format, args...)
}

func Warnf(format string, args ...any) {
	GlobalLogger.Warnf(format, args...)
}

func Errorf(format string, args ...any) {
	GlobalLogger.Errorf(format, args...)
}

func Fatalf(format string, args ...any) {
	GlobalLogger.Fatalf(format, args...)
}
