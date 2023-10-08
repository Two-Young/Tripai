package opencv

import (
	"gocv.io/x/gocv"
	"image"
)

func blur(img gocv.Mat, size int) *gocv.Mat {
	block := 2*size + 1
	gocv.Blur(img, &img, image.Pt(block, block))
	return &img
}

func threshold(img gocv.Mat, threshold int, typ gocv.ThresholdType) *gocv.Mat {
	gocv.Threshold(img, &img, float32(threshold), 255, typ)
	return &img
}

func adaptiveThreshold(img gocv.Mat, size int, c int) *gocv.Mat {
	block := 2*size + 1
	// grayscale?
	gocv.AdaptiveThreshold(img, &img, 255, gocv.AdaptiveThresholdMean, gocv.ThresholdBinary, block, float32(c))
	return &img
}

func bitwiseAnd(img1 gocv.Mat, img2 gocv.Mat) *gocv.Mat {
	gocv.BitwiseAnd(img1, img2, &img1)
	return &img1
}

func hsv(img gocv.Mat) *gocv.Mat {
	gocv.CvtColor(img, &img, gocv.ColorBGRToHSV)
	return &img
}

func mask(img gocv.Mat, lh, ls, lv, uh, us, uv float64) *gocv.Mat {
	gocv.InRangeWithScalar(
		img,
		gocv.NewScalar(lh, ls, lv, 0),
		gocv.NewScalar(uh, us, uv, 0), &img)
	return &img
}
