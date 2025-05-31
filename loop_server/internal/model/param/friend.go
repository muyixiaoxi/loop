package param

type DisposeFriendRequest struct {
	RequesterId uint `json:"requester_id" binding:"required"`
	Status      int  `json:"status" binding:"required"` // 1-同意，2-拒绝
}

type AddFriendRequest struct {
	FriendId uint   `json:"friend_id" binding:"required"`
	Message  string `json:"message"`
}

type DeleteFriendRequest struct {
	FriendId uint `json:"friend_id" binding:"required"`
}

type InviteFriendAddGroupList struct {
	UserId       uint   `json:"user_id"`
	UserAvatar   string `json:"user_avatar"`
	UserNickname string `json:"user_nickname"`
	IsGroup      bool   `json:"is_group"`
}
