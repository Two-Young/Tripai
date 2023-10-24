package platform

var (
	CategoryMeal      = "meal"      // 식사
	CategoryLodgment  = "lodgment"  // 숙박
	CategoryTransport = "transport" // 교통
	CategoryShopping  = "shopping"  // 쇼핑
	CategoryActivity  = "activity"  // 액티비티
	CategoryEtc       = "etc"       // 기타
	CategoryUnknown   = "unknown"   // 알 수 없음
)

type Currency struct {
	Code   string `json:"code"`
	Name   string `json:"name"`
	Symbol string `json:"symbol"`
}

type Country struct {
	CCA2       string     `json:"country_code"`
	CCA3       string     `json:"country_code3"`
	Alt        string     `json:"alt"`
	Png        string     `json:"png"`
	Svg        string     `json:"svg"`
	CommonName string     `json:"common_name"`
	Region     string     `json:"region"`
	Currencies []Currency `json:"currencies"`
}
