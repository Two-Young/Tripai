package opencv

import (
	"image"
)

// 50 200 100
func CropReceiptSubImage(img image.Image, minVal, maxVal, threshold float32) (image.Image, error) {
	// save img as temp file
	//filepath, _ := util.GenerateTempFilePath()
	//if err := util.SaveImageFileAsPng(img, filepath, false); err != nil {
	//	return nil, err
	//}
	//defer func() {
	//	// delete temp file
	//	if err := os.Remove(filepath); err != nil {
	//		log.Error(err)
	//		return
	//	}
	//	log.Debug("temp file deleted: " + filepath)
	//}()
	//
	//// image
	//cvImage := gocv.IMRead(filepath, gocv.IMReadColor)
	//defer cvImage.Close()
	//
	////gocv.GaussianBlur(cvImage, &cvImage, image.Point{X: 3, Y: 3}, 0, 0, gocv.BorderDefault)
	//gocv.Threshold(cvImage, &cvImage, threshold, 255, gocv.ThresholdBinary)
	//
	//hsv := gocv.NewMat()
	//defer hsv.Close()
	//gocv.CvtColor(cvImage, &hsv, gocv.ColorBGRToHSV)
	//
	//mask := gocv.NewMat()
	//defer mask.Close()
	//lower := gocv.NewScalar(0, 0, 200, 0)
	//upper := gocv.NewScalar(180, 255, 255, 0)
	//gocv.InRangeWithScalar(hsv, lower, upper, &mask)
	//return mask.ToImage()
	//
	////result := gocv.NewMat()
	////defer result.Close()
	////gocv.BitwiseAnd(img, img, &result)
	//
	//// gray
	//gray := gocv.NewMat()
	//defer gray.Close()
	//gocv.CvtColor(cvImage, &gray, gocv.ColorBGRToGray)
	//return gray.ToImage()
	//
	//// canny
	//canny := gocv.NewMat()
	//defer canny.Close()
	//gocv.Canny(gray, &canny, minVal, maxVal)
	//gocv.Threshold(canny, &canny, threshold, 255, gocv.ThresholdBinary)
	//
	//contours := gocv.FindContours(canny, gocv.RetrievalExternal, gocv.ChainApproxSimple)
	//if contours.Size() == 0 {
	//	return nil, errors.New("no contours found")
	//}
	//
	//// sort contours by area
	//totalArea := img.Bounds().Dx() * img.Bounds().Dy()
	//areaSum := 0
	//sortedContours := make([]util.Pair[int, gocv.PointVector], 0)
	//for i := 0; i < contours.Size(); i++ {
	//	contour := contours.At(i)
	//	area := gocv.ContourArea(contour)
	//	areaSum += int(area)
	//	if area > 0 {
	//		sortedContours = append(sortedContours, util.NewPair(i, contour))
	//	}
	//}
	//meanArea := float64(areaSum) / float64(contours.Size())
	//
	//sort.Slice(sortedContours, func(i, j int) bool {
	//	return gocv.ContourArea(sortedContours[i].Value) > gocv.ContourArea(sortedContours[j].Value)
	//})
	//
	//for i, contour := range sortedContours {
	//	log.Debugf("contour area: %.2f, length: %d", gocv.ContourArea(contour.Value), contour.Value.Size())
	//	gocv.DrawContours(&cvImage, contours, contour.Key, color.RGBA{G: 255, A: 255}, 2)
	//	if i > 10 {
	//		break
	//	}
	//}
	//
	//receiptContour := sortedContours[0]
	//receiptArea := gocv.ContourArea(receiptContour.Value)
	//areaRate := receiptArea / float64(totalArea)
	//log.Debugf(
	//	"area rate: %.3f%% [mean: %.2f] (%.2f/%.f)",
	//	areaRate*100, meanArea, receiptArea, float64(totalArea),
	//)
	//
	//if areaRate < 0 {
	//	return nil, errors.New("no receipt found or receipt is too small (less than 5%)")
	//}
	//
	//// debug
	//return cvImage.ToImage()
	return nil, nil

	// apply perspective transform
	// get 4 dots from receiptContour and transform as square
	//minX, minY := img.Bounds().Dx(), img.Bounds().Dy()
	//maxX, maxY := 0, 0
	//for i := 0; i < receiptContour.Size(); i++ {
	//	point := receiptContour.At(i)
	//	if point.X < minX {
	//		minX = point.X
	//	}
	//	if point.Y < minY {
	//		minY = point.Y
	//	}
	//	if point.X > maxX {
	//		maxX = point.X
	//	}
	//	if point.Y > maxY {
	//		maxY = point.Y
	//	}
	//}
	//width := maxX - minX
	//height := maxY - minY
	//
	//log.Debugf("transform to width/height: (%d, %d)", width, height)
	//
	////srcPoints := gocv.NewPointVector()
	////srcPoints.Append(receiptContour.At(0))
	////srcPoints.Append(receiptContour.At(1))
	////srcPoints.Append(receiptContour.At(2))
	////srcPoints.Append(receiptContour.At(3))
	//srcPoints := receiptContour
	//
	//dstPoints := gocv.NewPointVector()
	//dstPoints.Append(image.Point{X: 0, Y: 0})
	//dstPoints.Append(image.Point{X: width, Y: 0})
	//dstPoints.Append(image.Point{X: 0, Y: height})
	//dstPoints.Append(image.Point{X: width, Y: height})
	//perspectiveMatrix := gocv.GetPerspectiveTransform(srcPoints, dstPoints)
	//
	//result := gocv.NewMat()
	//defer result.Close()
	//gocv.WarpPerspective(cvImage, &result, perspectiveMatrix, image.Point{X: width, Y: height})
	//
	//newImage, err := result.ToImage()
	//if err != nil {
	//	return nil, err
	//}
	//
	//return newImage, nil
}
