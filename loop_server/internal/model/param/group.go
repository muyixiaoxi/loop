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
