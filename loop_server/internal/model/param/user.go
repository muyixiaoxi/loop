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

type QueryUserRequest struct {
	Phone  string `form:"phone"`
	UserId uint   `form:"user_id"`
}

type UpdateUserInfoRequest struct {
	Avatar    string `json:"avatar" binding:"required"`
	Nickname  string `json:"nickname" binding:"required"`
	Signature string `json:"signature"`
	Gender    *int   `json:"gender" binding:"required"`
	Age       *int   `json:"age" binding:"required"`
}

type UpdateUserPasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}
