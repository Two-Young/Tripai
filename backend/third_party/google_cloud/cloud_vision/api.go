package cloud_vision

import (
	vision "cloud.google.com/go/vision/apiv1"
	pb "cloud.google.com/go/vision/v2/apiv1/visionpb"
	"context"
	"google.golang.org/api/option"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"travel-ai/log"
	"travel-ai/util"
)

var KeyFile string

func Initialize() {
	KeyFile = filepath.Join(util.GetRootDirectory(), "credentials", "travel-ai-390323-76bb44cf3e83.json")
}

// RequestImageToText gets text from the Vision API for an image at the given file path.
func RequestImageToText(path string) ([]string, error) {
	ctx := context.Background()
	client, err := vision.NewImageAnnotatorClient(ctx, option.WithCredentialsFile(KeyFile))
	if err != nil {
		return nil, err
	}
	defer client.Close()

	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}

	image, err := vision.NewImageFromReader(f)
	if err != nil {
		return nil, err
	}

	annotations, err := client.DetectTexts(ctx, image, nil, 10)
	if err != nil {
		return nil, err
	}
	if len(annotations) == 0 {
		log.Debug("No text found.")
		return nil, nil
	}

	processReceiptAnnotation(annotations, 10)

	return nil, nil
}

func processReceiptAnnotation(annotations []*pb.EntityAnnotation, yTolerance int32) {
	// sort annotations by y position
	sort.Slice(annotations, func(i, j int) bool {
		return annotations[i].BoundingPoly.Vertices[0].Y < annotations[j].BoundingPoly.Vertices[0].Y
	})

	for i := 0; i < len(annotations); {
		// find text annotations on the same line
		line := []string{}
		lineY := getMinY(annotations[i].BoundingPoly)
		for ; i < len(annotations) && getYDiff(lineY, annotations[i].BoundingPoly) < yTolerance; i++ {
			line = append(line, annotations[i].Description)
		}

		// separate line into item name and price
		itemName, price := splitLine(line)
		if itemName != "" && price != "" {
			log.Debugf("Item: %s, Price: %s", itemName, price)
		}
	}
}

// getMinY gives the minimum y coordinate of a bounding polygon.
func getMinY(poly *pb.BoundingPoly) int32 {
	minY := poly.Vertices[0].Y
	for _, vertex := range poly.Vertices {
		if vertex.Y < minY {
			minY = vertex.Y
		}
	}
	return minY
}

// getYDiff gives the difference between the y coordinate of a bounding polygon and a y coordinate.
func getYDiff(y1 int32, poly *pb.BoundingPoly) int32 {
	minY := getMinY(poly)
	if y1 < minY {
		return minY - y1
	}
	return y1 - minY
}

// splitLine separates a line of text into an item name and price.
func splitLine(line []string) (string, string) {
	// iterate through the line backwards
	for i := 0; i < len(line); i++ {
		if isPrice(line[i]) {
			if len(line) < i+1 {
				return "", ""
			}
			split := line[i+1:]

			// reverse the item name
			reversed := make([]string, len(split))
			for j := 0; j < len(split); j++ {
				reversed[j] = split[len(split)-j-1]
			}

			itemName := strings.Join(reversed, " ")
			sanitized := sanitizeItemName(itemName)
			price := line[i]
			return sanitized, price
		}
	}
	return "", ""
}

// isPrice checks if a string is a price.
func isPrice(text string) bool {
	// remove all non-numeric characters and check if the string is a number
	text = strings.ReplaceAll(text, ".", "")
	_, err := strconv.Atoi(text)
	return err == nil
}

func sanitizeItemName(text string) string {
	// remove all non-alphabetical characters (left space, a-z, A-Z)
	reg, err := regexp.Compile("[^a-zA-Z ]+")
	if err != nil {
		log.Fatal(err)
	}
	replaced := reg.ReplaceAllString(text, "")
	return strings.TrimSpace(replaced)
}
