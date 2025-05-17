package param

type AddMember struct {
	GroupId uint   `json:"group_id"`
	UserIds []uint `json:"user_ids"`
}

type DeleteMember struct {
	GroupId uint `json:"group_id"`
	UserId  uint `json:"user_id"`
}

type AddAdmin struct {
	GroupId uint `json:"group_id"`
	UserId  uint `json:"user_id"`
}

type DeleteGroup struct {
	GroupId uint `json:"group_id"`
}

type GroupId struct {
	GroupId uint `json:"group_id" form:"group_id"`
}

type Member struct {
	UserID    uint   `json:"user_id,omitempty"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar,omitempty"`
	Signature string `json:"signature"`
	Gender    int    `json:"gender,omitempty"`
	Age       int    `json:"age"`
	Role      int    `json:"role"`
}
