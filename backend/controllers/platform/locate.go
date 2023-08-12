package platform

import (
	"errors"
	"github.com/gin-gonic/gin"
	"net/http"
	"travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/platform"
	"travel-ai/service/platform/database_io"
	"travel-ai/third_party/google_cloud/places"
)

func AutoComplete(c *gin.Context) {
	var body locateAutocompleteRequestDto
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
		return
	}
	result, err := places.GetAutoComplete(body.Input)
	if err != nil {
		log.Error(err)
		util.AbortWithErrJson(c, http.StatusBadRequest, err)
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
		util.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	cache, err := database_io.GetPlaceDetailCache(c, query.PlaceId)
	if err != nil {
		log.Error(err)
		util.AbortWithErrJson(c, http.StatusInternalServerError, err)
		return
	}

	data := locateLocationResponseDto{
		PlaceId:        *cache.PlaceId,
		Name:           *cache.Name,
		Address:        *cache.Address,
		PhotoReference: "",
		Longitude:      *cache.Longitude,
		Latitude:       *cache.Latitude,
	}
	if cache.PhotoReference != nil {
		data.PhotoReference = *cache.PhotoReference
	}

	c.JSON(http.StatusOK, data)
}

func Pin(c *gin.Context) {
	var query locatePinRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}
	result, err := places.GetPlaceByLatLng(query.Latitude, query.Longitude)
	if err != nil {
		log.Error(err)
		util.AbortWithErrJson(c, http.StatusBadRequest, err)
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
		util.AbortWithErrJson(c, http.StatusBadRequest, errors.New("invalid request query"))
		return
	}
	result, err := places.GetPlacePhoto(query.Reference, query.MaxWidth)
	if err != nil {
		log.Error(err)
		util.AbortWithErrJson(c, http.StatusBadRequest, err)
		return
	}
	defer result.Data.Close()
	c.DataFromReader(http.StatusOK, -1, result.ContentType, result.Data, nil)
}

func Direction(c *gin.Context) {
	var query locateDirectionQueryDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query")
		return
	}

	originCache, err := database_io.GetPlaceDetailCache(c, query.OriginalPlaceId)
	if err != nil {
		log.Error(err)
		util.AbortWithErrJson(c, http.StatusBadRequest, err)
		return
	}
	destCache, err := database_io.GetPlaceDetailCache(c, query.DestinationPlaceId)
	if err != nil {
		log.Error(err)
		util.AbortWithErrJson(c, http.StatusBadRequest, err)
		return
	}

	originLatLng := *originCache.LatLng
	destLatLng := *destCache.LatLng

	result, err := places.GetPlaceDirection(originLatLng, destLatLng)
	if err != nil {
		log.Error(err)
		util.AbortWithErrJson(c, http.StatusBadRequest, err)
		return
	}

	data := make(locateDirectionResponseDto, 0)
	if len(result) > 0 {
		polyline := result[0].OverviewPolyline
		points, err := polyline.Decode()
		if err != nil {
			log.Error(err)
			util.AbortWithErrJson(c, http.StatusBadRequest, err)
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
			Latitude:  *originCache.Latitude,
			Longitude: *originCache.Longitude,
		})
		data = append(data, locateCoordinate{
			Latitude:  *destCache.Latitude,
			Longitude: *destCache.Longitude,
		})
	}
	c.JSON(http.StatusOK, data)
}

func Countries(c *gin.Context) {
	countries := make([]platform.Country, 0)
	for _, c := range platform.CountriesMap {
		countries = append(countries, c)
	}
	c.JSON(http.StatusOK, countries)
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
