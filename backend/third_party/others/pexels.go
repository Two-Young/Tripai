package others

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"travel-ai/libs/math"
	"travel-ai/log"
	"travel-ai/service/database"
)

var ApiKey string

const (
	LocalCacheCountThreshold = 10 // if local cache count is less than this, fetch from api
)

func Initialize() {
	ApiKey = os.Getenv("PIXELS_API_KEY")
}

type FreeImage struct {
	Id              int    `json:"id"`
	Width           int    `json:"width"`
	Height          int    `json:"height"`
	Url             string `json:"url"`
	Photographer    string `json:"photographer"`
	PhotographerUrl string `json:"photographer_url"`
	PhotographerId  int    `json:"photographer_id"`
	Src             struct {
		Original  string `json:"original"`
		Large2x   string `json:"large2x"`
		Large     string `json:"large"`
		Medium    string `json:"medium"`
		Small     string `json:"small"`
		Portrait  string `json:"portrait"`
		Landscape string `json:"landscape"`
		Tiny      string `json:"tiny"`
	}
}

type FreeImageSearchResult struct {
	TotalResults int         `json:"total_results"`
	Page         int         `json:"page"`
	PerPage      int         `json:"per_page"`
	Photos       []FreeImage `json:"photos"`
}

func GetFreeImageUrlByKeyword(keyword string) (string, error) {
	// first find in cache of database
	cachedRandUrl := ""
	var sessionThumbnailCaches []database.SessionThumbnailCacheEntity
	if err := database.DB.Select(
		&sessionThumbnailCaches,
		"SELECT * FROM session_thumbnail_caches WHERE keyword = ?", keyword); err == nil {
		cacheCount := len(sessionThumbnailCaches)
		if cacheCount > 0 {
			cachedRandUrl = *sessionThumbnailCaches[math.RandIntByMax(cacheCount)].Url
			if len(sessionThumbnailCaches) >= LocalCacheCountThreshold {
				return cachedRandUrl, nil
			}
		}
	}

	// encode keyword
	keyword = url.QueryEscape(keyword)

	// fetch from pixels api
	requestUrl := "https://api.pexels.com/v1/search?query=" + keyword + "&per_page=3"
	req, err := http.NewRequest("GET", requestUrl, nil)
	if err != nil {
		return "", err
	}

	req.Header.Add("Authorization", ApiKey)
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	// parse response
	bodyContent, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	remainLimitStr := resp.Header.Get("X-Ratelimit-Remaining")
	remainLimit := 0
	if remainLimitStr == "" {
		remainLimit = 0
	} else {
		lim, err := strconv.Atoi(remainLimitStr)
		if err != nil {
			return "", err
		}
		remainLimit = lim
	}

	var freeImageSearchResult FreeImageSearchResult
	if err := json.Unmarshal(bodyContent, &freeImageSearchResult); err != nil {
		return "", err
	}

	if freeImageSearchResult.TotalResults == 0 {
		if cachedRandUrl != "" {
			return cachedRandUrl, nil
		}
		log.Debug("No image found for keyword: " + keyword)
		return "", nil
	}

	log.Debugf("Pixels API Remaining limit: %d", remainLimit)
	idxRange := math.Min(len(freeImageSearchResult.Photos), 30)
	randIdx := math.RandInt() % (int)(idxRange)
	imageUrl := freeImageSearchResult.Photos[randIdx].Src.Original

	// save to database
	if imageUrl != "" {
		if _, err := database.DB.Exec(
			"INSERT INTO session_thumbnail_caches (keyword, url) VALUES (?, ?)",
			keyword, imageUrl); err != nil {
			log.Error(err)
		}
	}

	return imageUrl, nil
}
