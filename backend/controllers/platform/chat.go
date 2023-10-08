package platform

import (
	"github.com/gin-gonic/gin"
)

// 나중에 세션 외부 채팅을 구현할 때 재사용
func GetChatRooms(c *gin.Context) {
	//var body ChatGetRoomsRequestDto
	//if err := c.ShouldBindQuery(&body); err != nil {
	//	log.Error(err)
	//	util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
	//	return
	//}
	//
	//chatRooms, err := database_io.GetChatRoomsWithUserInfoByUserId(body.SessionId)
	//if err != nil {
	//	log.Error(err)
	//	util2.AbortWithErrJson(c, http.StatusInternalServerError, err)
	//	return
	//}
	//
	//// sort by created_at (desc)
	//sort.Slice(chatRooms, func(i, j int) bool {
	//	return chatRooms[i].CreatedAt.After(chatRooms[j].CreatedAt)
	//})
	//
	//resp := make([]ChatGetRoomsResponseItem, 0)
	//for _, chatRoom := range chatRooms {
	//	item := ChatGetRoomsResponseItem{
	//		ChatRoomId: chatRoom.ChatroomId,
	//		CreatedAt:  chatRoom.CreatedAt.UnixMilli(),
	//		LastUpdate: chatRoom.LastUpdate.UnixMilli(),
	//	}
	//	item.Participants = make([]ChatGetRoomsParticipant, 0)
	//	for _, user := range chatRoom.Users {
	//		item.Participants = append(item.Participants, ChatGetRoomsParticipant{
	//			UserId:       user.UserId,
	//			Username:     user.Username,
	//			ProfileImage: user.ProfileImage,
	//		})
	//	}
	//	resp = append(resp, item)
	//}
	//c.JSON(http.StatusOK, resp)
}

func CreateChatRoom(c *gin.Context) {
	//uid := c.GetString("uid")
	//
	//var body ChatCreateRoomRequestDto
	//if err := c.ShouldBindJSON(&body); err != nil {
	//	log.Error(err)
	//	util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
	//	return
	//}
	//
	//chatRoomId := uuid.New().String()
	//
	//tx, err := database.DB.BeginTx(c, nil)
	//if err != nil {
	//	log.Error(err)
	//	c.AbortWithStatus(http.StatusInternalServerError)
	//	return
	//}
	//
	//// check if session exists
	//session, err := database_io.GetSession(body.SessionId)
	//if err != nil {
	//	log.Error(err)
	//	util2.AbortWithStrJson(c, http.StatusBadRequest, "session id is invalid")
	//	return
	//}
	//if session == nil {
	//	util2.AbortWithStrJson(c, http.StatusBadRequest, "session does not exist")
	//	return
	//}
	//
	//// insert chatroom
	//if err := database_io.InsertChatRoomTx(tx, database.ChatRoomEntity{
	//	ChatroomId: chatRoomId,
	//	SessionId:  session.SessionId,
	//	CreatedAt:  time.Now(),
	//	LastUpdate: time.Now(),
	//}); err != nil {
	//	log.Error(err)
	//	tx.Rollback()
	//	c.AbortWithStatus(http.StatusInternalServerError)
	//	return
	//}
	//
	//// insert chatroom user
	//participants := body.Participants
	//participants = append(participants, uid)
	//for _, participant := range participants {
	//	exists, err := database_io.DoesUserExist(participant)
	//	if err != nil {
	//		log.Error(err)
	//		tx.Rollback()
	//		c.AbortWithStatus(http.StatusInternalServerError)
	//		return
	//	}
	//	if !exists {
	//		tx.Rollback()
	//		util2.AbortWithStrJson(c, http.StatusBadRequest, fmt.Sprintf("user %s does not exist", participant))
	//		return
	//	}
	//
	//	if err := database_io.InsertChatRoomUserTx(tx, database.ChatRoomsUserEntity{
	//		ChatroomId: chatRoomId,
	//		UserId:     uid,
	//	}); err != nil {
	//		log.Error(err)
	//		tx.Rollback()
	//		c.AbortWithStatus(http.StatusInternalServerError)
	//		return
	//	}
	//}
	//
	//if err := tx.Commit(); err != nil {
	//	log.Error(err)
	//	tx.Rollback()
	//	c.AbortWithStatus(http.StatusInternalServerError)
	//	return
	//}
	//
	//c.JSON(http.StatusOK, chatRoomId)
}

//func InviteChatRoom(c *gin.Context) {
//	uid := c.GetString("uid")
//
//	var body ChatInviteRequestDto
//	if err := c.ShouldBindJSON(&body); err != nil {
//		log.Error(err)
//		util2.AbortWithStrJson(c, http.StatusBadRequest, "invalid request body")
//		return
//	}
//
//	// check is user participant of chatroom
//	yes, err := platform.IsParticipantOfChatRoom(uid, body.ChatRoomId)
//	if err != nil {
//		log.Error(err)
//		c.AbortWithStatus(http.StatusInternalServerError)
//		return
//	}
//	if !yes {
//		util2.AbortWithStrJson(c, http.StatusBadRequest, fmt.Sprintf("user %s is not participant of chatroom %s", uid, body.ChatRoomId))
//		return
//	}
//
//	// check invited user exists
//	exists, err := database_io.DoesUserExist(body.InvitedUserId)
//	if err != nil {
//		log.Error(err)
//		c.AbortWithStatus(http.StatusInternalServerError)
//		return
//	}
//	if !exists {
//		util2.AbortWithStrJson(c, http.StatusBadRequest, fmt.Sprintf("user %s does not exist", body.InvitedUserId))
//		return
//	}
//
//	// check if chatroom exists
//	chatRoom, err := database_io.GetChatRoom(body.ChatRoomId)
//	if err != nil {
//		log.Error(err)
//		util2.AbortWithStrJson(c, http.StatusBadRequest, fmt.Sprintf("chatroom %s does not exist", body.ChatRoomId))
//		return
//	}
//
//	// check if invited user is in session
//	yes, err = platform.IsSessionMember(body.InvitedUserId, chatRoom.SessionId)
//	if err != nil {
//		log.Error(err)
//		c.AbortWithStatus(http.StatusInternalServerError)
//		return
//	}
//	if !yes {
//		util2.AbortWithStrJson(c, http.StatusBadRequest, fmt.Sprintf("user %s is not in session %s", body.InvitedUserId, chatRoom.SessionId))
//		return
//	}
//
//	// check if user already is in chatroom
//	yes, err = platform.IsParticipantOfChatRoom(body.InvitedUserId, body.ChatRoomId)
//	if err != nil {
//		log.Error(err)
//		c.AbortWithStatus(http.StatusInternalServerError)
//		return
//	}
//	if yes {
//		util2.AbortWithStrJson(c, http.StatusBadRequest, fmt.Sprintf("user %s is already in chatroom %s", body.InvitedUserId, body.ChatRoomId))
//		return
//	}
//
//	tx, err := database.DB.BeginTx(c, nil)
//	if err != nil {
//		log.Error(err)
//		c.AbortWithStatus(http.StatusInternalServerError)
//		return
//	}
//
//	// insert chatroom user
//	if err := database_io.InsertChatRoomUserTx(tx, database.ChatRoomsUserEntity{
//		ChatroomId: body.ChatRoomId,
//		UserId:     body.InvitedUserId,
//	}); err != nil {
//		log.Error(err)
//		tx.Rollback()
//		c.AbortWithStatus(http.StatusInternalServerError)
//		return
//	}
//
//	// commit
//	if err := tx.Commit(); err != nil {
//		log.Error(err)
//		tx.Rollback()
//		c.AbortWithStatus(http.StatusInternalServerError)
//		return
//	}
//
//	socket.SocketManager.Io.BroadcastToRoom("/chat", socket.RoomKey(body.ChatRoomId), "userInvited")
//	c.Status(http.StatusOK)
//}

func UseChatRouter(g *gin.RouterGroup) {
	rg := g.Group("/chat")
	rg.GET("/getRooms", GetChatRooms)
	rg.POST("/create", CreateChatRoom)
	//rg.POST("/invite", InviteChatRoom)
}
