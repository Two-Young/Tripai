package auth

import "github.com/gin-gonic/gin"

func UseAuthRouter(r *gin.Engine) {
	g := r.Group("/auth")
	UseGoogleAuthRouter(g)
}
