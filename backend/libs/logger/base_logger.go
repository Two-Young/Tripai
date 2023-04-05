package logger

import (
	"fmt"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"
	"travel-ai/libs/color"
	"travel-ai/libs/console"
	MemJson "travel-ai/libs/json"
	"travel-ai/libs/math"
	MemStrings "travel-ai/libs/strings"
)

type BaseLogger struct {
	label  string
	config BaseLoggerConfig
}

type BaseLoggerConfig struct {
	labelMaxLen      int
	levelMaxLen      int
	callStackMaxSize int
	callStackMaxLen  int
}

func DefaultBaseLoggerConfig() BaseLoggerConfig {
	return BaseLoggerConfig{
		labelMaxLen:      12,
		levelMaxLen:      6,
		callStackMaxSize: 2,
		callStackMaxLen:  30,
	}
}

func NewBaseLogger(label string) BaseLogger {
	bl := new(BaseLogger)
	bl.label = label
	bl.config = DefaultBaseLoggerConfig()
	return *bl
}

func NewBaseLoggerWithoutLabel() BaseLogger {
	bl := new(BaseLogger)
	bl.config = DefaultBaseLoggerConfig()
	return *bl
}

func (bl *BaseLogger) Write(p []byte) (n int, err error) {
	str := string(p[:])
	reg := regexp.MustCompile(`(\n\n+)|(\s+)$`)
	str = reg.ReplaceAllString(str, "")
	str = strings.ReplaceAll(str, "\r", "")
	bl.preComposeLog(NIL, MemJson.PrettyMarshal, false, str)
	return len(p), nil
}

func (bl *BaseLogger) Test(args ...any) {
	bl.preComposeLog(TEST, MemJson.PrettyMarshal, false, args...)
}

func (bl *BaseLogger) Debug(args ...any) {
	bl.preComposeLog(DEBUG, MemJson.PrettyMarshal, false, args...)
}

func (bl *BaseLogger) Info(args ...any) {
	bl.preComposeLog(INFO, MemJson.Marshal, false, args...)
}

func (bl *BaseLogger) Warn(args ...any) {
	bl.preComposeLog(WARN, MemJson.Marshal, false, args...)
}

func (bl *BaseLogger) Error(args ...any) {
	bl.preComposeLog(ERROR, MemJson.Marshal, false, args...)
}

func (bl *BaseLogger) Fatal(args ...any) {
	bl.preComposeLog(FATAL, MemJson.Marshal, false, args...)
}

func (bl *BaseLogger) Testf(format string, args ...any) {
	bl.preComposeLog(TEST, MemJson.PrettyMarshal, true, format, args)
}

func (bl *BaseLogger) Debugf(format string, args ...any) {
	bl.preComposeLog(DEBUG, MemJson.PrettyMarshal, true, format, args)
}

func (bl *BaseLogger) Infof(format string, args ...any) {
	bl.preComposeLog(INFO, MemJson.Marshal, true, format, args)
}

func (bl *BaseLogger) Warnf(format string, args ...any) {
	bl.preComposeLog(WARN, MemJson.Marshal, true, format, args)
}

func (bl *BaseLogger) Errorf(format string, args ...any) {
	bl.preComposeLog(ERROR, MemJson.Marshal, true, format, args)
}

func (bl *BaseLogger) Fatalf(format string, args ...any) {
	bl.preComposeLog(FATAL, MemJson.Marshal, true, format, args)
}

func (bl *BaseLogger) preComposeLog(level Level, marshalFunc MemJson.MarshalFunc, isFormatMode bool, args ...any) {
	if isFormatMode {
		format := args[0].(string)
		newArgs := args[1].([]any)
		contents := fmt.Sprintf(format, newArgs...)
		bl.composeLog(level, marshalFunc, []any{contents})
	} else {
		bl.composeLog(level, marshalFunc, args)
	}
}

func (bl *BaseLogger) composeLog(level Level, marshalFunc MemJson.MarshalFunc, contents []any) {
	// Context Tag
	label := bl.label
	if label == "" {
		label = "GLOBAL"
	}

	if len(bl.label) > bl.config.labelMaxLen {
		label = bl.label[:bl.config.labelMaxLen-3] + "..."
	}

	contextSeg := console.Csprintf("[%"+strconv.Itoa(bl.config.labelMaxLen)+"s]", color.CYAN, label)

	// Time Tag
	loc, _ := time.LoadLocation("Asia/Seoul")
	t := time.Now().In(loc)
	timeSeg := fmt.Sprintf("%d.%02d.%02d %02d:%02d:%02d.%06d", t.Year(), t.Month(), t.Day(), t.Hour(), t.Minute(), t.Second(), t.Nanosecond()/1000)

	// Level Tag
	levelColor := getLevelColor(level)
	levelSeg := console.Csprintf("%6s", levelColor, string(level))

	// Call Stack Tag
	maxFileSegmentLen := bl.config.callStackMaxLen
	callStackSeg := bl.getCallStackSegment(bl.config.callStackMaxSize)
	if len(callStackSeg) > maxFileSegmentLen {
		firstDotIndex := strings.Index(callStackSeg, ".")
		callStackSeg = callStackSeg[firstDotIndex+1:]
		callStackSeg = "..." + callStackSeg[math.MaxInt(len(callStackSeg)-maxFileSegmentLen, 0):]
	}
	callStackSeg = console.Csprintf("%-"+strconv.Itoa(maxFileSegmentLen)+"s", color.YELLOW, callStackSeg)

	// Build String
	builtSeg := bl.buildLog([]string{contextSeg, timeSeg, levelSeg, callStackSeg, ":"}, contents, marshalFunc)
	console.Println(builtSeg)
}

func (bl *BaseLogger) buildLog(segments []string, contents []any, marshalFunc MemJson.MarshalFunc) string {
	stringBuilder := MemStrings.NewStringBuilder()
	stringBuilder.SetMarshaller(marshalFunc)

	for _, segment := range segments {
		stringBuilder.Append(segment).Space()
	}

	for _, content := range contents {
		stringBuilder.Append(content).Space()
	}

	return stringBuilder.Build()
}

func (bl *BaseLogger) getCallStackSegment(stack int) string {
	pcs := make([]uintptr, 10)
	n := runtime.Callers(6, pcs)
	pcs = pcs[:n]
	frames := runtime.CallersFrames(pcs)

	var callStackSegments []string
	var slicedFrames []runtime.Frame

	for {
		frame, more := frames.Next()
		if !more {
			break
		}
		slicedFrames = append(slicedFrames, frame)
	}

	// Count of frames to slice of end of stacks
	slicedFrames = bl.reverseFrameSlice(slicedFrames)
	slicedFrames = slicedFrames[math.MaxInt(len(slicedFrames)-stack, 0):]

	for _, frame := range slicedFrames {
		filepath := frame.File
		filepathSegmentsByDot := strings.Split(filepath, ".")
		extensionIndex := math.MaxInt(len(filepathSegmentsByDot)-2, 0)
		filepathExceptExtension := filepathSegmentsByDot[extensionIndex]
		filepathSegmentsBySlash := strings.Split(filepathExceptExtension, "/")

		fileSeg := filepathSegmentsBySlash[len(filepathSegmentsBySlash)-1]
		lineNumSeg := strconv.Itoa(frame.Line)

		callStackSegments = append(callStackSegments, fileSeg+"("+lineNumSeg+")")
	}

	return strings.Join(callStackSegments, ".")
}

func (bl *BaseLogger) reverseFrameSlice(slice []runtime.Frame) []runtime.Frame {
	var reversed []runtime.Frame
	sliceLen := len(slice)
	for i := 0; i < sliceLen; i++ {
		reversed = append(reversed, slice[sliceLen-1-i])
	}
	return reversed
}
