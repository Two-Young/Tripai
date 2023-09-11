package cloud_vision

import (
	vision "cloud.google.com/go/vision/apiv1"
	pb "cloud.google.com/go/vision/v2/apiv1/visionpb"
	"context"
	"google.golang.org/api/option"
	"image"
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
func RequestImageToText(path string) ([]*pb.EntityAnnotation, error) {
	ctx := context.Background()
	client, err := vision.NewImageAnnotatorClient(ctx, option.WithCredentialsFile(KeyFile))
	if err != nil {
		return nil, err
	}
	defer client.Close()

	// TODO :: preprocess image
	//preprocessImage(path)

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

	return annotations, nil
}

func PreprocessImage(img image.Image) (image.Image, error) {
	//ctx := context.Background()
	//client, err := vision.NewImageAnnotatorClient(ctx, option.WithCredentialsFile(KeyFile))
	//if err != nil {
	//	return nil, err
	//}
	//defer client.Close()
	//
	//// save img as temp file
	//filepath, _ := util.GenerateTempFilePath()
	//if err := util.SaveImageFileAsPng(img, filepath, false); err != nil {
	//	return nil, err
	//}
	//f, err := os.Open(filepath)
	//if err != nil {
	//	return nil, err
	//}
	//defer func() {
	//	if err := f.Close(); err != nil {
	//		return
	//	}
	//	// delete temp file
	//	if err := os.Remove(filepath); err != nil {
	//		log.Error(err)
	//		return
	//	}
	//}()
	//
	//// load img from temp file
	//pbImage, err := vision.NewImageFromReader(f)
	//if err != nil {
	//	return nil, err
	//}
	//
	//// 1. match bound edge & crop
	//cropHints, err := client.CropHints(ctx, pbImage, nil)
	//if err != nil {
	//	return nil, err
	//}
	//if len(cropHints.CropHints) == 0 {
	//	log.Debug("No crop hints found.")
	//	return nil, nil
	//}
	//
	//type cropHint struct {
	//	Confidence float32
	//	Vertices   []*pb.Vertex
	//}
	//
	//// filter valid crop hints
	//validCropHints := make([]cropHint, 0)
	//for _, hint := range cropHints.CropHints {
	//	vertices := hint.BoundingPoly.Vertices
	//	if len(vertices) != 4 {
	//		continue
	//	}
	//
	//	// sort vertices by y position & x position
	//	sort.Slice(vertices, func(i, j int) bool {
	//		if vertices[i].Y == vertices[j].Y {
	//			return vertices[i].X < vertices[j].X
	//		}
	//		return vertices[i].Y < vertices[j].Y
	//	})
	//
	//	validCropHints = append(validCropHints, cropHint{
	//		Confidence: hint.Confidence,
	//		Vertices:   vertices,
	//	})
	//}
	//
	//if len(validCropHints) == 0 {
	//	return nil, fmt.Errorf("no valid crop hints found")
	//}
	//
	//// pick most confident crop hint
	//sort.Slice(validCropHints, func(i, j int) bool {
	//	return validCropHints[i].Confidence > validCropHints[j].Confidence
	//})
	//
	//hint := validCropHints[0]
	//log.Debugf("Crop hint confidence: %v", hint.Confidence)
	//log.Debugf("Crop hint bounding polygon: %v", hint.Vertices)
	//vertices := make([]util.Vertex, 0)
	//for _, v := range hint.Vertices {
	//	vertices = append(vertices, util.Vertex{
	//		X: int(v.X),
	//		Y: int(v.Y),
	//	})
	//}
	//
	//croppedImg, err := util.CropSquare(img, vertices)
	//if err != nil {
	//	return nil, err
	//}

	//croppedImg, err := opencv.CropReceiptSubImage(img, 50, 200, 100)
	//if err != nil {
	//	return nil, err
	//}
	//
	//// 2. clear noise
	//return croppedImg, nil
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
