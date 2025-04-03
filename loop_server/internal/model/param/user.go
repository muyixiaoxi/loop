package param

type RegisterRequest struct {
	Nickname string `json:"nickname" binding:"required"`
	Password string `json:"password" binding:"required"`
	Phone    string `json:"phone" binding:"required"`
}

type LoginRequest struct {
	Password string `json:"password"`
	Phone    string `json:"phone"`
}

type LoginResponse struct {
	Token    string `json:"token"`
	Avatar   string `json:"avatar"`
	Nickname string `json:"nickname"`
}

type AddFriendRequest struct {
	FriendId uint   `json:"friend_id" binding:"required"`
	Message  string `json:"message"`
}

type QueryUserRequest struct {
	Phone  string `form:"phone"`
	UserId uint   `form:"user_id"`
}

type DisposeFriendRequest struct {
	RequesterId uint `json:"requester_id" binding:"required"`
	Status      int  `json:"status" binding:"required"` // 1-同意，2-拒绝
}
