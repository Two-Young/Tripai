package opencv

import (
	"image"
	"image/color"
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

	_blurBlock := 1
	_threshold := 0
	_adaptiveThresholdBlock := 27
	_adaptiveThresholdC := 7
	lowH, upH := 10, 160
	lowS, upS := 0, 255
	lowV, upV := 100, 255

	blurredImg := blur(cvImage, _blurBlock)
	thresholdedImg := threshold(*blurredImg, _threshold, gocv.ThresholdToZero)
	adaptiveThresholdedImg := adaptiveThreshold(*thresholdedImg, _adaptiveThresholdBlock, _adaptiveThresholdC)
	bitwisedImg := bitwiseAnd(*adaptiveThresholdedImg, *blurredImg)
	hsvImg := hsv(*bitwisedImg)
	masked := mask(*hsvImg, float64(lowH), float64(lowS), float64(lowV), float64(upH), float64(upS), float64(upV))

	// crop receipt
	var newImg *gocv.Mat
	cvImage.CopyTo(newImg)

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

	// poly set
	epsilon := 0.03 * gocv.ArcLength(*largestContour, true)
	approx := gocv.ApproxPolyDP(*largestContour, epsilon, true)

	// bounds
	boundingRect := gocv.BoundingRect(approx)
	mask := gocv.NewMatWithSize(boundingRect.Dy(), boundingRect.Dx(), cvImage.Type())

	// draw contours
	gocv.DrawContours(&mask, contours, -1, color.RGBA{
		R: 255,
		G: 255,
		B: 255,
		A: 255,
	}, -1)

	// convex hull
	var hull *gocv.Mat
	gocv.ConvexHull(approx, hull, true, false)

	// rect points
	type Point struct {
		x, y int32
	}
	lu := Point{int32(boundingRect.Min.X), int32(boundingRect.Min.Y)}
	ru := Point{int32(boundingRect.Max.X), int32(boundingRect.Min.Y)}
	ld := Point{int32(boundingRect.Min.X), int32(boundingRect.Max.Y)}
	rd := Point{int32(boundingRect.Max.X), int32(boundingRect.Max.Y)}

	// find extreme points of hull
	leftTopMost := lu
	rightTopMost := ru
	leftBottomMost := ld
	rightBottomMost := rd

	for i := 0; i < hull.Rows(); i++ {
		point := hull.GetVeciAt(i, 0)
		x := point[0]
		y := point[1]

		if x < leftTopMost.x {
			leftTopMost = Point{x, y}
		}
		if x > rightTopMost.x {
			rightTopMost = Point{x, y}
		}
		if y < leftBottomMost.y {
			leftBottomMost = Point{x, y}
		}
		if y > rightBottomMost.y {
			rightBottomMost = Point{x, y}
		}
	}

	// make transform src and dst points
	srcPointVector := gocv.NewPointVector()
	srcPointVector.Append(image.Pt(int(leftTopMost.x), int(leftTopMost.y)))
	srcPointVector.Append(image.Pt(int(rightTopMost.x), int(rightTopMost.y)))
	srcPointVector.Append(image.Pt(int(leftBottomMost.x), int(leftBottomMost.y)))
	srcPointVector.Append(image.Pt(int(rightBottomMost.x), int(rightBottomMost.y)))

	dstPointVector := gocv.NewPointVector()
	dstPointVector.Append(image.Pt(int(lu.x), int(lu.y)))
	dstPointVector.Append(image.Pt(int(ru.x), int(ru.y)))
	dstPointVector.Append(image.Pt(int(ld.x), int(ld.y)))
	dstPointVector.Append(image.Pt(int(rd.x), int(rd.y)))

	// perspective transform
	transformed := gocv.GetPerspectiveTransform(srcPointVector, dstPointVector)
	warped := gocv.NewMat()
	gocv.WarpPerspective(*newImg, &warped, transformed, image.Pt(mask.Cols(), mask.Rows()))

	newImage, err := warped.ToImage()
	if err != nil {
		return nil, err
	}

	return newImage, nil
}
