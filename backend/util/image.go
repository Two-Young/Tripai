package util

import (
	"fmt"
	"image"
	"image/color"
	math2 "travel-ai/libs/math"
)

type Vertex struct {
	X, Y int
}

func CropSquare(img image.Image, vertices []Vertex) (image.Image, error) {
	if len(vertices) != 4 {
		return nil, fmt.Errorf("invalid vertices length: %d", len(vertices))
	}

	tl, tr, bl, br := vertices[0], vertices[1], vertices[2], vertices[3]
	// validate vertices
	// top left
	if tl.X > tr.X || tl.Y > bl.Y {
		return nil, fmt.Errorf("invalid top left vertex: %v", tl)
	}
	// top right
	if tr.X < tl.X || tr.Y > br.Y {
		return nil, fmt.Errorf("invalid top right vertex: %v", tr)
	}
	// bottom left
	if bl.X > br.X || bl.Y < tl.Y {
		return nil, fmt.Errorf("invalid bottom left vertex: %v", bl)
	}
	// bottom right
	if br.X < bl.X || br.Y < tr.Y {
		return nil, fmt.Errorf("invalid bottom right vertex: %v", br)
	}

	// read pixels and create new image
	top := int(math2.Min(tl.Y, tr.Y))
	bottom := int(math2.Max(bl.Y, br.Y))
	left := int(math2.Min(tl.X, bl.X))
	right := int(math2.Max(tr.X, br.X))
	width := right - left
	height := bottom - top

	// create new image
	newImg := image.NewRGBA(image.Rect(0, 0, width, height))

	// stretch cropped image to square
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			// with affine transformation
			oc := Vertex{
				X: int(float64(x)/float64(width)*float64(right-left)) + left,
				Y: int(float64(y)/float64(height)*float64(bottom-top)) + top,
			}
			newImg.Set(x, y, img.At(oc.X, oc.Y))
		}
	}

	return newImg, nil
}

func meanFilter(img image.Image, offset int) image.Image {
	bounds := img.Bounds()
	width, height := bounds.Max.X, bounds.Max.Y
	newImg := image.NewRGBA(bounds)

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			var r, g, b, count uint32
			for dy := -offset; dy <= offset; dy++ {
				for dx := -offset; dx <= offset; dx++ {
					newX, newY := x+dx, y+dy
					if newX >= 0 && newX < width && newY >= 0 && newY < height {
						r1, g1, b1, _ := img.At(newX, newY).RGBA()
						r += r1
						g += g1
						b += b1
						count++
					}
				}
			}
			r /= count
			g /= count
			b /= count
			newImg.Set(x, y, color.RGBA{uint8(r / 256), uint8(g / 256), uint8(b / 256), 255})
		}
	}

	return newImg
}
