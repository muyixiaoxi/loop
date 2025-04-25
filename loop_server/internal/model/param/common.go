package param

type Page struct {
	PageNum  int `form:"page_num"`  // 默认为 1
	PageSize int `form:"page_size"` // 默认为 10
}

func (p *Page) Init() {
	p.PageSize = max(10, p.PageSize)
	p.PageNum = max(1, p.PageNum)
}
