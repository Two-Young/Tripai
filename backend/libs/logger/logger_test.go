package logger

import "testing"

func TestBaseLogger_Test(t *testing.T) {
	bl := NewBaseLogger("asdf")
	bl.Test("Test Logger Test")
	bl.Test("Test", "Multiple", "Arguments")
	bl.Test("Test", 5, 0.15, "different", []int{3, 5})
}

func TestBaseLogger_Debug(t *testing.T) {
	bl := NewBaseLogger("asdf")
	bl.Debug("Debug Logger Test")
	test1("Debug1")
	test2("Debug2")
}

func test1(message string) {
	bl := NewBaseLogger("asdf")
	bl.Debug(message)
}

func test2(message string) {
	bl := NewBaseLogger("asdf")
	bl.Debug(message)
	test3("Debug2-1")
}

func test3(message string) {
	bl := NewBaseLogger("asdf")
	bl.Debug(message)
}

func TestBaseLogger_Info(t *testing.T) {
	bl := NewBaseLogger("asdf")
	bl.Info("Info Logger Test")
	bl.Info("Marshaller", "Test", "?3")
}

func TestBaseLogger_Warn(t *testing.T) {
	bl := NewBaseLogger("asdf")
	bl.Warn("Warn Logger Test")
}

func TestBaseLogger_Error(t *testing.T) {
	bl := NewBaseLogger("asdf")
	bl.Error("Error Logger Test")
}

func TestBaseLogger_Fatal(t *testing.T) {
	bl := NewBaseLogger("asdf")
	bl.Fatal("Fatal Logger Test")
}
