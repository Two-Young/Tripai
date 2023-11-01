package socket

func RoomKey(roomId string) string {
	return "chatroom:" + roomId
}

func RoomGptKey(roomId string) string {
	return "chatroom:gpt:" + roomId
}
