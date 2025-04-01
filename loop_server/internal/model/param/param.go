package param

type RegisterRequest struct {
	Nickname string `json:"nickname"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
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
