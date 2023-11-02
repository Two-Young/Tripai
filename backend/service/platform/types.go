package platform

const (
	CategoryMeal      = "meal"
	CategoryLodgment  = "lodgment"
	CategoryTransport = "transport"
	CategoryShopping  = "shopping"
	CategoryActivity  = "activity"
	CategoryEtc       = "etc"
	CategoryUnknown   = "unknown"
)

var (
	ExpenditureCategories = map[string]string{
		CategoryMeal:      "meal",
		CategoryLodgment:  "lodgment",
		CategoryTransport: "transport",
		CategoryShopping:  "shopping",
		CategoryActivity:  "activity",
		CategoryEtc:       "etc",
		CategoryUnknown:   "unknown",
	}
	SupportedCategories = []string{
		CategoryMeal,
		CategoryLodgment,
		CategoryTransport,
		CategoryShopping,
		CategoryActivity,
		CategoryEtc,
	}
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
