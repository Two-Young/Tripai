package platform

import (
	"github.com/gin-gonic/gin"
	"math/big"
	"net/http"
	util2 "travel-ai/controllers/util"
	"travel-ai/log"
	"travel-ai/service/platform"
	"travel-ai/service/platform/database_io"
)

func SettlementInfo(c *gin.Context) {
	uid := c.GetString("uid")

	var query SettlementInfoGetRequestDto
	if err := c.ShouldBindQuery(&query); err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request query: "+err.Error())
		return
	}

	// check if session exists
	_, err := database_io.GetSession(query.SessionId)
	if err != nil {
		log.Error(err)
		util2.AbortWithStrJson(c, http.StatusBadRequest, "session does not exist")
		return
	}

	// check if user is in session
	yes, err := platform.IsSessionMember(uid, query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	if !yes {
		util2.AbortWithStrJson(c, http.StatusBadRequest, "user is not in session")
		return
	}

	// get user
	user, err := database_io.GetUser(uid)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	resp := SettlementInfoGetResponseDto{
		SessionUsage: SettlementInfoUsage{
			Meal:        0,
			Lodgment:    0,
			Transport:   0,
			Shopping:    0,
			Activity:    0,
			Etc:         0,
			Unknown:     0,
			TotalBudget: 0,
		},
		MyUsage: SettlementInfoUsage{
			Meal:        0,
			Lodgment:    0,
			Transport:   0,
			Shopping:    0,
			Activity:    0,
			Etc:         0,
			Unknown:     0,
			TotalBudget: 0,
		},
		Settlements: nil,
	}

	currencyCode := user.DefaultCurrencyCode

	// get all budgets in session
	budgetEntities, err := database_io.GetBudgetsBySessionId(query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	for _, budgetEntity := range budgetEntities {
		amount := budgetEntity.Amount
		exchanged, err := platform.Exchange(budgetEntity.CurrencyCode, currencyCode, amount)
		if err != nil {
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		resp.SessionUsage.TotalBudget += exchanged
		if budgetEntity.UserId == uid {
			resp.MyUsage.TotalBudget += exchanged
		}
	}

	// get all users in session
	userEntities, err := database_io.GetSessionMembers(query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	type UserPayment struct {
		Used float64
		Paid float64
	}
	userPayments := make(map[string]UserPayment)
	sessionMembers := make(map[string]*database_io.SessionMemberEntity)
	for _, userEntity := range userEntities {
		userPayments[userEntity.UserId] = UserPayment{
			Used: 0, // by $currencyCode
			Paid: 0,
		}
		sessionMembers[userEntity.UserId] = userEntity
	}

	// get my expenditure distributions with payers in session
	expenditures, err := database_io.GetExpenditureDistributionWithPayersBySessionId(query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}
	for _, exp := range expenditures {
		totalPrice := exp.TotalPrice
		stdTotalPrice, err := platform.Exchange(exp.CurrencyCode, currencyCode, totalPrice)
		if err != nil {
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		// add paid amount to userPayments
		paidDivision := stdTotalPrice / float64(len(exp.Payers))
		for _, payer := range exp.Payers {
			prev, ok := userPayments[payer.UserId]
			if !ok {
				log.Debugf("user not found: %s", payer.UserId)
				continue
			}
			prev.Paid += paidDivision
			userPayments[payer.UserId] = prev
		}

		// add used amount to userPayments
		currentUserUsage := 0.0
		for _, dist := range exp.Distributions {
			amount, _ := big.NewRat(dist.Numerator, dist.Denominator).Float64()
			exchanged, err := platform.Exchange(exp.CurrencyCode, currencyCode, amount)
			if err != nil {
				log.Error(err)
				c.AbortWithStatus(http.StatusInternalServerError)
				return
			}

			prev, ok := userPayments[dist.UserId]
			if !ok {
				log.Debugf("user not found: %s", dist.UserId)
				continue
			}
			prev.Used += exchanged
			userPayments[dist.UserId] = prev

			if dist.UserId == uid {
				currentUserUsage += exchanged
			}
		}

		// add to session usage
		switch exp.Category {
		case platform.CategoryMeal:
			resp.SessionUsage.Meal += stdTotalPrice
			resp.MyUsage.Meal += currentUserUsage
		case platform.CategoryLodgment:
			resp.SessionUsage.Lodgment += stdTotalPrice
			resp.MyUsage.Lodgment += currentUserUsage
		case platform.CategoryTransport:
			resp.SessionUsage.Transport += stdTotalPrice
			resp.MyUsage.Transport += currentUserUsage
		case platform.CategoryShopping:
			resp.SessionUsage.Shopping += stdTotalPrice
			resp.MyUsage.Shopping += currentUserUsage
		case platform.CategoryActivity:
			resp.SessionUsage.Activity += stdTotalPrice
			resp.MyUsage.Activity += currentUserUsage
		case platform.CategoryEtc:
			resp.SessionUsage.Etc += stdTotalPrice
			resp.MyUsage.Etc += currentUserUsage
		default:
			resp.SessionUsage.Unknown += stdTotalPrice
			resp.MyUsage.Unknown += currentUserUsage
		}
	}

	// sanitize userPayments
	for _, userEntity := range userEntities {
		payment := userPayments[userEntity.UserId]
		if payment.Used > payment.Paid {
			payment.Used -= payment.Paid
			payment.Paid = 0
		} else if payment.Used < payment.Paid {
			payment.Paid -= payment.Used
			payment.Used = 0
		} else {
			delete(userPayments, userEntity.UserId)
			continue
		}
		userPayments[userEntity.UserId] = payment
	}

	// calculates used & paid users
	deptors := make([]string, 0)
	creditors := make([]string, 0)
	for userId, payment := range userPayments {
		if payment.Used > 0 {
			deptors = append(deptors, userId)
		} else if payment.Paid > 0 {
			creditors = append(creditors, userId)
		}
	}

	type Dept struct {
		From         string
		To           string
		Amount       float64
		CurrencyCode string
	}
	depts := make(map[string]map[string]Dept)
	addDept := func(from string, to string, amount float64) {
		if _, ok := depts[from]; !ok {
			depts[from] = make(map[string]Dept)
		}
		dept, ok := depts[from][to]
		if !ok {
			depts[from][to] = Dept{
				From:         from,
				To:           to,
				Amount:       0,
				CurrencyCode: currencyCode,
			}
		}
		dept.Amount += amount
		depts[from][to] = dept

		// edit userPayments
		payment := userPayments[from]
		payment.Used -= amount
		userPayments[from] = payment
		payment = userPayments[to]
		payment.Paid -= amount
		userPayments[to] = payment
	}

	for i, j := 0, 0; i < len(deptors) && j < len(creditors); {
		deptor := deptors[i]
		creditor := creditors[j]
		dept := userPayments[deptor].Used
		credit := userPayments[creditor].Paid

		if dept > credit {
			addDept(deptor, creditor, credit)
			j++
		} else if dept < credit {
			addDept(deptor, creditor, dept)
			i++
		} else {
			addDept(deptor, creditor, dept)
			i++
			j++
		}
	}

	// get all transactions in session
	transactions, err := database_io.GetTransactionsBySessionId(query.SessionId)
	if err != nil {
		log.Error(err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	// apply transactions to depts
	for _, transaction := range transactions {
		amount := transaction.Amount
		exchanged, err := platform.Exchange(transaction.CurrencyCode, currencyCode, amount)
		if err != nil {
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		deptsByUser, ok := depts[transaction.SenderUid]
		if !ok {
			continue
		}
		targetDept, ok := deptsByUser[transaction.ReceiverUid]
		if !ok {
			continue
		}
		targetDept.Amount -= exchanged
		if targetDept.Amount <= 0 {
			delete(deptsByUser, transaction.ReceiverUid)
		} else {
			deptsByUser[transaction.ReceiverUid] = targetDept
		}
	}

	// filter depts by current user
	filteredDepts := make([]Dept, 0)
	for _, deptsByUser := range depts {
		for _, dept := range deptsByUser {
			if dept.From == uid && dept.To == uid {
				log.Errorf("invalid dept: %v", dept)
				c.AbortWithStatus(http.StatusInternalServerError)
			}
			if dept.From == uid || dept.To == uid {
				filteredDepts = append(filteredDepts, dept)
			}
		}
	}

	// recalculate dept amount to creditor's default currency with depts (not credit)
	for i, dept := range filteredDepts {
		if dept.To == uid {
			continue
		}

		creditorInfo, ok := sessionMembers[dept.To]
		if !ok {
			log.Errorf("user not found in session: %s", dept.To)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}

		amount, err := platform.Exchange(currencyCode, creditorInfo.DefaultCurrencyCode, dept.Amount)
		if err != nil {
			log.Error(err)
			c.AbortWithStatus(http.StatusInternalServerError)
			return
		}
		filteredDepts[i].Amount = amount
		filteredDepts[i].CurrencyCode = creditorInfo.DefaultCurrencyCode
	}

	// make settlements
	settlements := make([]SettlementInfoSettlement, 0)
	for _, dept := range filteredDepts {
		targetUserId := dept.To
		if dept.To == uid {
			targetUserId = dept.From
		}
		settlements = append(settlements, SettlementInfoSettlement{
			Owed:         dept.From == uid,
			TargetUserId: targetUserId,
			Amount:       dept.Amount,
			CurrencyCode: dept.CurrencyCode,
		})
	}

	resp.Settlements = settlements
	c.JSON(http.StatusOK, resp)
}

func CompleteSettlement(c *gin.Context) {
	// TODO :: implement
}

func UseSettlementRouter(g *gin.RouterGroup) {
	rg := g.Group("/settlement")
	rg.GET("", SettlementInfo)
	rg.POST("", CompleteSettlement)
}
