package opencv

import (
	"image"
	"math"
	"os"
	"travel-ai/log"
	"travel-ai/util"

	"gocv.io/x/gocv"
)

func CropReceiptSubImage(img image.Image) (image.Image, error) {
	// save img as temp file
	filepath, _ := util.GenerateTempFilePath()
	if err := util.SaveImageFileAsPng(img, filepath, false); err != nil {
		return nil, err
	}
	defer func() {
		// delete temp file
		if err := os.Remove(filepath); err != nil {
			log.Error(err)
			return
		}
		log.Debug("temp file deleted: " + filepath)
	}()

	// image
	cvImage := gocv.IMRead(filepath, gocv.IMReadColor)
	defer cvImage.Close()
	// calculate cvImage volume
	cvImageVolume := float64(cvImage.Rows() * cvImage.Cols())

	//_blurBlock := 1
	//_threshold := 0
	//_adaptiveThresholdBlock := 27
	//_adaptiveThresholdC := 7
	//lowH, upH := 15, 175
	//lowS, upS := 0, 255
	//lowV, upV := 100, 255

	_blurBlock := 1
	_threshold := 0
	_adaptiveThresholdBlock := 13
	_adaptiveThresholdC := 7
	lowH, upH := 15, 175
	lowS, upS := 0, 255
	lowV, upV := 100, 255

	blurredImg := blur(&cvImage, _blurBlock)
	thresholdedImg := threshold(blurredImg, _threshold, gocv.ThresholdToZero)
	grayScaledImg := grayscale(thresholdedImg)
	adaptiveThresholdedImg := adaptiveThreshold(grayScaledImg, _adaptiveThresholdBlock, _adaptiveThresholdC)
	bitwisedImg := bitwiseAnd(*blurredImg, *adaptiveThresholdedImg)
	hsvTransformed := hsv(*bitwisedImg)
	//hsvImg, err := hsvTransformed.ToImage()
	//if err != nil {
	//	return nil, err
	//}
	//defer hsvTransformed.Close()
	//hsvRgbImg, err := gocv.ImageToMatRGB(hsvImg)
	//if err != nil {
	//	return nil, err
	//}
	//return hsvRgbImg.ToImage()
	//hsvRgbHsvImg := hsv(hsvRgbImg)
	masked := mask(*hsvTransformed, float64(lowH), float64(lowS), float64(lowV), float64(upH), float64(upS), float64(upV))
	// calculate white pixel volume
	whitePixelVolume := float64(gocv.CountNonZero(*masked))
	//return masked.ToImage()

	// crop receipt
	newImg, mask := gocv.NewMat(), gocv.NewMat()
	cvImage.CopyTo(&newImg)
	cvImage.CopyTo(&mask)

	// find contours
	contours := gocv.FindContours(*masked, gocv.RetrievalExternal, gocv.ChainApproxSimple)
	if contours.Size() == 0 {
		// no receipt found, just return original image
		return newImg.ToImage()
	}

	// find largest contour
	var largestContour *gocv.PointVector
	for i := 0; i < contours.Size(); i++ {
		contour := contours.At(i)
		if largestContour == nil || contour.Size() > largestContour.Size() {
			largestContour = &contour
		}
	}
	largestContourVolume := gocv.ContourArea(*largestContour)

	// poly set
	epsilon := 0.03 * gocv.ArcLength(*largestContour, true)
	approx := gocv.ApproxPolyDP(*largestContour, epsilon, true)

	// draw approx
	//approxList := gocv.NewPointsVector()
	//approxList.Append(approx)
	//gocv.DrawContours(&mask, approxList, -1, color.RGBA{
	//	R: 255,
	//	G: 0,
	//	B: 0,
	//}, 2)
	//return mask.ToImage()

	// bounds
	boundingRect := gocv.BoundingRect(approx)

	// draw contours
	//largestContourList := gocv.NewPointsVector()
	//largestContourList.Append(*largestContour)
	//gocv.DrawContours(&mask, largestContourList, -1, color.RGBA{
	//	R: 0,
	//	G: 255,
	//	B: 0,
	//	A: 255,
	//}, 2)
	//return mask.ToImage()

	// convex hull
	hull := gocv.NewMatWithSize(cvImage.Rows(), cvImage.Cols(), cvImage.Type())
	gocv.ConvexHull(approx, &hull, true, false)

	// rect points
	type Point struct {
		x, y int32
	}
	lu := Point{0, 0}
	ru := Point{int32(boundingRect.Dx()) - 1, 0}
	ld := Point{0, int32(boundingRect.Dy()) - 1}
	rd := Point{int32(boundingRect.Dx()) - 1, int32(boundingRect.Dy()) - 1}

	// find extreme points
	sums := make([]int, hull.Rows())
	diffs := make([]int, hull.Rows())
	hullPoints := gocv.NewPointVector()

	for i := 0; i < hull.Rows(); i++ {
		index := hull.GetIntAt(i, 0)
		point := approx.At(int(index))

		x := int32(point.X)
		y := int32(point.Y)

		// sums와 diffs 계산
		sums[i] = int(x + y)
		diffs[i] = int(x - y)

		hullPoints.Append(image.Pt(int(x), int(y)))
	}

	if len(sums) < 4 {
		log.Debugf("convex hull points not found")
		return newImg.ToImage()
	}

	// 극단점 찾기
	leftTopMostIdx := indexOfMin(sums)
	rightBottomMostIdx := indexOfMax(sums)
	rightTopMostIdx := indexOfMax(diffs)
	leftBottomMostIdx := indexOfMin(diffs)

	leftTopMost := approx.At(int(hull.GetIntAt(leftTopMostIdx, 0)))
	rightBottomMost := approx.At(int(hull.GetIntAt(rightBottomMostIdx, 0)))
	rightTopMost := approx.At(int(hull.GetIntAt(rightTopMostIdx, 0)))
	leftBottomMost := approx.At(int(hull.GetIntAt(leftBottomMostIdx, 0)))

	//hulls := gocv.NewPointsVector()
	//hulls.Append(hullPoints)
	//gocv.DrawContours(&newImg, hulls, -1, color.RGBA{
	//	R: 0,
	//	G: 255,
	//	B: 0,
	//	A: 255,
	//}, 2)
	//
	//hullPoints.Close()
	//hulls.Close()
	//
	//return newImg.ToImage()

	// make transform src and dst points
	srcPointVector := gocv.NewPointVector()
	srcPointVector.Append(image.Pt(leftTopMost.X, leftTopMost.Y))
	srcPointVector.Append(image.Pt(leftBottomMost.X, leftBottomMost.Y))
	srcPointVector.Append(image.Pt(rightBottomMost.X, rightBottomMost.Y))
	srcPointVector.Append(image.Pt(rightTopMost.X, rightTopMost.Y))

	dstPointVector := gocv.NewPointVector()
	dstPointVector.Append(image.Pt(int(lu.x), int(lu.y)))
	dstPointVector.Append(image.Pt(int(ld.x), int(ld.y)))
	dstPointVector.Append(image.Pt(int(rd.x), int(rd.y)))
	dstPointVector.Append(image.Pt(int(ru.x), int(ru.y)))

	extremeVolume := gocv.ContourArea(srcPointVector)
	extremeProportion := extremeVolume / largestContourVolume
	suppressRate := extremeVolume / cvImageVolume
	suppressRate2 := extremeVolume / whitePixelVolume

	log.Debugf("extreme proportion: %v", extremeProportion)
	log.Debugf("suppress rate: %v", suppressRate)
	log.Debugf("Contour edges: %v", largestContour.Size())

	confidence := suppressRate / math.Log10(float64(largestContour.Size()))
	confidence2 := suppressRate2 / math.Log10(float64(largestContour.Size()))
	log.Debugf("confidence: %v", confidence*100)
	log.Debugf("confidence2: %v", confidence2*100)

	//log.Debugf("src points: (%v, %v), (%v, %v), (%v, %v), (%v, %v)",
	//	leftTopMost.X, leftTopMost.Y,
	//	leftBottomMost.X, leftBottomMost.Y,
	//	rightBottomMost.X, rightBottomMost.Y,
	//	rightTopMost.X, rightTopMost.Y)
	//
	//log.Debugf("dst points: (%v, %v), (%v, %v), (%v, %v), (%v, %v)",
	//	lu.x, lu.y,
	//	ld.x, ld.y,
	//	rd.x, rd.y,
	//	ru.x, ru.y)

	if confidence < 0.1 || confidence2 < 0.15 {
		log.Debugf("give up as low confidence: %v, %v", confidence, confidence2)
		return newImg.ToImage()
	}

	// perspective transform
	transformed := gocv.GetPerspectiveTransform(srcPointVector, dstPointVector)
	warped := gocv.NewMat()
	gocv.WarpPerspective(newImg, &warped, transformed, image.Pt(boundingRect.Dx(), boundingRect.Dy()))

	newImage, err := warped.ToImage()
	if err != nil {
		return nil, err
	}

	return newImage, nil
}

func indexOfMin(slice []int) int {
	min := slice[0]
	minIdx := 0

	for i, value := range slice {
		if value < min {
			min = value
			minIdx = i
		}
	}

	return minIdx
}

func indexOfMax(slice []int) int {
	max := slice[0]
	maxIdx := 0

	for i, value := range slice {
		if value > max {
			max = value
			maxIdx = i
		}
	}

	return maxIdx
}
