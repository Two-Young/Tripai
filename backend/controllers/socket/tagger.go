package socket

func RoomKey(roomId string) string {
	return "chatroom:" + roomId
}
