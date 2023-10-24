package opencv

import (
	"gocv.io/x/gocv"
	"image"
)

func blur(img *gocv.Mat, size int) *gocv.Mat {
	newImg := gocv.NewMat()
	block := 2*size + 1
	gocv.Blur(*img, &newImg, image.Pt(block, block))
	return &newImg
}

func threshold(img *gocv.Mat, threshold int, typ gocv.ThresholdType) *gocv.Mat {
	newImg := gocv.NewMat()
	gocv.Threshold(*img, &newImg, float32(threshold), 255, typ)
	return &newImg
}

func adaptiveThreshold(img *gocv.Mat, size int, c int) *gocv.Mat {
	newImg := gocv.NewMat()
	block := 2*size + 1
	gocv.AdaptiveThreshold(*img, &newImg, 255, gocv.AdaptiveThresholdMean, gocv.ThresholdBinary, block, float32(c))
	return &newImg
}

func bitwiseAnd(img gocv.Mat, mask gocv.Mat) *gocv.Mat {
	newImg := gocv.NewMat()
	gocv.BitwiseAndWithMask(img, img, &newImg, mask)
	return &newImg
}

func grayscale(img *gocv.Mat) *gocv.Mat {
	newImg := gocv.NewMat()
	gocv.CvtColor(*img, &newImg, gocv.ColorBGRToGray)
	return &newImg
}

func hsv(img gocv.Mat) *gocv.Mat {
	newImg := gocv.NewMat()
	gocv.CvtColor(img, &newImg, gocv.ColorBGRToHSV)
	return &newImg
}

func hsl(img gocv.Mat) *gocv.Mat {
	newImg := gocv.NewMat()
	gocv.CvtColor(img, &newImg, gocv.ColorBGRToHLS)
	return &newImg
}

func mask(img gocv.Mat, lh, ls, lv, uh, us, uv float64) *gocv.Mat {
	newImg := gocv.NewMat()
	gocv.InRangeWithScalar(
		img,
		gocv.NewScalar(lh, ls, lv, 0),
		gocv.NewScalar(uh, us, uv, 0), &newImg)
	return &newImg
}
