package controller

import (
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"io/ioutil"
	"net/http"
	"os"
	"travel-ai/log"
)

func Route(c *gin.Context) {
	originCoord := c.Query("origin")
	destCoord := c.Query("dest")

	apiKey := os.Getenv("GOOGLE_ROUTES_API_KEY")

	url := fmt.Sprintf("https://maps.googleapis.com/maps/api/directions/json?origin=%s&destination=%s&key=%s", originCoord, destCoord, apiKey)

	// API 요청 보내기
	response, err := http.Get(url)
	if err != nil {
		fmt.Println("API 요청 실패:", err)
		return
	}
	defer response.Body.Close()

	// 응답 데이터 읽기
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		fmt.Println("응답 데이터 읽기 실패:", err)
		return
	}

	// 응답 데이터 구문 분석
	var data map[string]interface{}
	err = json.Unmarshal(body, &data)
	if err != nil {
		fmt.Println("데이터 구문 분석 실패:", err)
		return
	}

	log.Debug(data)

	// 경로 정보 추출
	routes := data["routes"].([]interface{})
	if len(routes) > 0 {
		legs := routes[0].(map[string]interface{})["legs"].([]interface{})
		if len(legs) > 0 {
			distance := legs[0].(map[string]interface{})["distance"].(map[string]interface{})["text"].(string)
			duration := legs[0].(map[string]interface{})["duration"].(map[string]interface{})["text"].(string)
			fmt.Println("거리:", distance)
			fmt.Println("소요 시간:", duration)
		}
	}
}

func UseRoutesRouter(g *gin.RouterGroup) {
	sg := g.Group("/routes")
	sg.POST("/route", Route)
}
