package util

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/google/uuid"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"reflect"
	"regexp"
	"runtime"
	"strconv"
	"strings"
	"time"
	"travel-ai/log"
)

func GetPublicIp() (string, error) {
	resp, err := http.Get("http://ipinfo.io/ip")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	ip, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	ipv4 := strings.TrimSpace(string(ip))

	// check ipv4 with regex
	ipv4_regex := `^(((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4})`
	if match, _ := regexp.MatchString(ipv4_regex, ipv4); !match {
		return "", fmt.Errorf("invalid ipv4: %v", ipv4)
	}
	return ipv4, nil
}

// GenerateTempFilePath generates a temporary file path and filename.
func GenerateTempFilePath() (string, string) {
	tempId := uuid.New().String()
	rootDir := GetRootDirectory()
	dest := filepath.Join(rootDir, "/temp/", tempId)
	return dest, tempId
}

func SaveImageFileAsPng(image image.Image, dest string, allowOverwrite bool) error {
	// check if dest is occupied
	if _, err := os.Stat(dest); !errors.Is(err, os.ErrNotExist) {
		if allowOverwrite {
			if err := os.Remove(dest); err != nil {
				return err
			}
		} else {
			return fmt.Errorf("file already exists: %v", dest)
		}
	}
	f, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer f.Close()

	if err = png.Encode(f, image); err != nil {
		return err
	}
	return nil
}

func SaveImageFileAsJpeg(image image.Image, dest string, allowOverwrite bool) error {
	// check if dest is occupied
	if _, err := os.Stat(dest); !errors.Is(err, os.ErrNotExist) {
		if allowOverwrite {
			if err := os.Remove(dest); err != nil {
				return err
			}
		} else {
			return fmt.Errorf("file already exists: %v", dest)
		}
	}
	f, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer f.Close()

	if err = jpeg.Encode(f, image, nil); err != nil {
		return err
	}
	return nil
}

func OpenFileAsImage(path string) (image.Image, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		return nil, err
	}

	return img, nil
}

func InterfaceToStruct(src interface{}, dst interface{}) error {
	jsonData, err := json.Marshal(src)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(jsonData, &dst); err != nil {
		return err
	}
	return nil
}

func CurrentTimeMillis() int64 {
	return time.Now().UnixNano() / int64(time.Millisecond)
}

func ParseDuration(str string) (time.Duration, error) {
	// Duration string without last character (the unit)
	valueStr := str[:len(str)-1]

	// Parse the duration value as a float64
	value, err := strconv.ParseFloat(valueStr, 64)
	if err != nil {
		return 0, fmt.Errorf("invalid duration string: %v", str)
	}

	// Get the duration unit (last character)
	unit := str[len(str)-1:]

	// Convert the duration value to a time.Duration based on the unit
	switch unit {
	case "c": // century
		return time.Duration(value * float64(time.Hour) * 24 * 365 * 100), nil
	case "y": // year
		return time.Duration(value * float64(time.Hour) * 24 * 365), nil
	case "w": // week
		return time.Duration(value * float64(time.Hour) * 24 * 7), nil
	case "d": // day
		return time.Duration(value * float64(time.Hour) * 24), nil
	case "h": // hour
		return time.Duration(value * float64(time.Hour)), nil
	case "m": // minute
		return time.Duration(value * float64(time.Minute)), nil
	case "s": // second
		return time.Duration(value * float64(time.Second)), nil
	case "ms": // millisecond
		return time.Duration(value * float64(time.Millisecond)), nil
	default:
		return 0, fmt.Errorf("unknown duration unit: %v", unit)
	}
}

func StructToReadable(src interface{}) *bytes.Buffer {
	jsonData, err := json.Marshal(src)
	if err != nil {
		log.Error(err)
		return nil
	}
	buffer := bytes.NewBuffer(jsonData)
	return buffer
}

func GetRootDirectory() string {
	_, b, _, _ := runtime.Caller(0)
	return filepath.Dir(filepath.Dir(b))
}

func AppendFilename(src string, append string) string {
	ext := filepath.Ext(src)
	name := src[:len(src)-len(ext)]
	return name + append + ext
}

func IsNumber(data any) bool {
	_type := reflect.TypeOf(data)
	return IsNumberType(_type)
}

func IsNumberType(_type reflect.Type) bool {
	switch _type.Kind() {
	case reflect.Float64, reflect.Float32, reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64, reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return true
	default:
		return false
	}
}
