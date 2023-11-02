package cloud_vision

import (
	vision "cloud.google.com/go/vision/apiv1"
	pb "cloud.google.com/go/vision/v2/apiv1/visionpb"
	"context"
	"google.golang.org/api/option"
	"os"
	"path/filepath"
	"travel-ai/log"
	"travel-ai/util"
)

var KeyFile string

func Initialize() {
	KeyFile = filepath.Join(util.GetRootDirectory(), "credentials", "travel-ai-390323-76bb44cf3e83.json")
}

// TODO :: [Future] delete this function?

func RequestImageToText(path string) ([]*pb.EntityAnnotation, error) {
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

	return annotations, nil
}
