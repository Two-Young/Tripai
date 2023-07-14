package controller

import (
	"encoding/json"
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
	"travel-ai/log"
	"travel-ai/third_party/google_cloud/maps"
)

func AutoComplete(c *gin.Context) {
	var body locateAutocompleteRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, errors.New("invalid request body"))
		return
	}
	result, err := maps.GetAutoComplete(body.Input)
	if err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}
	data := make(locateAutocompleteResponseDto, 0)
	for _, prediction := range result {
		data = append(data, locateAutocompletePrediction{
			PlaceId:     prediction.PlaceID,
			Description: prediction.Description,
		})
	}
	c.JSON(http.StatusOK, data)
}

func Location(c *gin.Context) {
	var query locateLocationQueryDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, errors.New("invalid request query"))
		return
	}
	result, err := maps.GetPlaceDetail(query.PlaceId)
	if err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}
	data := locateLocationResponseDto{
		PlaceId:        result.PlaceID,
		Name:           result.Name,
		Address:        result.FormattedAddress,
		PhotoReference: "",
		Longitude:      result.Geometry.Location.Lng,
		Latitude:       result.Geometry.Location.Lat,
	}
	if len(result.Photos) > 0 {
		data.PhotoReference = result.Photos[0].PhotoReference
	}
	c.JSON(http.StatusOK, data)
}

func Pin(c *gin.Context) {
	var query locatePinRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, errors.New("invalid request query"))
		return
	}
	result, err := maps.GetPlaceByLatLng(query.Latitude, query.Longitude)
	if err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	data := make(locatePinResponseDto, 0)
	for _, candidate := range result {
		data = append(data, placeDetail{
			PlaceId:        candidate.PlaceID,
			Name:           "",
			Address:        candidate.FormattedAddress,
			PhotoReference: "",
			Longitude:      candidate.Geometry.Location.Lng,
			Latitude:       candidate.Geometry.Location.Lat,
		})
	}
	c.JSON(http.StatusOK, data)
}

func PlacePhoto(c *gin.Context) {
	var query locatePlacePhotoQueryDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, errors.New("invalid request query"))
		return
	}
	result, err := maps.GetPlacePhoto(query.Reference, query.MaxWidth)
	if err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}
	defer result.Data.Close()
	c.DataFromReader(http.StatusOK, -1, result.ContentType, result.Data, nil)
}

func Direction(c *gin.Context) {
	var query locateDirectionQueryDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, errors.New("invalid request query"))
		return
	}

	originDetail, err := maps.GetPlaceDetail(query.OriginalPlaceId)
	if err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}
	destDetail, err := maps.GetPlaceDetail(query.DestinationPlaceId)
	if err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	originLocation := originDetail.Geometry.Location
	destLocation := destDetail.Geometry.Location

	originLatLng := originLocation.String()
	destLatLng := destLocation.String()

	result, err := maps.GetPlaceDirection(originLatLng, destLatLng)
	if err != nil {
		log.Error(err)
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	data := make(locateDirectionResponseDto, 0)
	if len(result) > 0 {
		polyline := result[0].OverviewPolyline
		points, err := polyline.Decode()
		if err != nil {
			log.Error(err)
			c.AbortWithError(http.StatusBadRequest, err)
			return
		}
		for _, point := range points {
			data = append(data, locateCoordinate{
				Latitude:  point.Lat,
				Longitude: point.Lng,
			})
		}
	} else {
		data = append(data, locateCoordinate{
			Latitude:  originLocation.Lat,
			Longitude: originLocation.Lng,
		})
		data = append(data, locateCoordinate{
			Latitude:  destLocation.Lat,
			Longitude: destLocation.Lng,
		})
	}
	c.JSON(http.StatusOK, data)
}

func Countries(c *gin.Context) {
	resp, err := http.Get("https://restcountries.com/v3.1/all?fields=name,flags,cca2")
	if err != nil {
		return
	}
	defer resp.Body.Close()
	var countriesData []map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&countriesData); err != nil {
		return
	}

	data := make(locateCountriesResponseDto, 0)
	for _, country := range countriesData {
		data = append(data, locateCountriesItem{
			CountryCode: country["cca2"].(string),
			CommonName:  country["name"].(map[string]interface{})["common"].(string),
			Alt:         country["name"].(map[string]interface{})["common"].(string),
			Png:         country["flags"].(map[string]interface{})["png"].(string),
			Svg:         country["flags"].(map[string]interface{})["svg"].(string),
		})
	}

	c.JSON(http.StatusOK, data)
}

func UseLocateRouter(g *gin.RouterGroup) {
	rg := g.Group("/locate")
	rg.POST("/auto-complete", AutoComplete)
	rg.GET("/location", Location)
	rg.GET("/pin", Pin)
	rg.GET("/place-photo", PlacePhoto)
	rg.GET("/direction", Direction)
	rg.GET("/countries", Countries)
}
