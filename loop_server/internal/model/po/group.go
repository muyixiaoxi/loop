package po

import (
	"gorm.io/gorm"
	"loop_server/internal/model/dto"
	"time"
)

type Group struct {
	gorm.Model
	Name     string `gorm:"comment:群名称;type:varchar(16);not null"`  // 群名称
	Avatar   string `gorm:"comment:群头像;type:varchar(256);not null"` // 群头像
	Describe string `gorm:"comment:群简介;type:varchar(128);not null"` // 群简介
	OwnerId  uint   `gorm:"comment:群主id;type:bigint;not null"`      // 群主id
}

func (*Group) TableName() string {
	return "group"
}

func (g *Group) ConvertDto() *dto.Group {
	var created *time.Time
	var updated *time.Time
	if !g.CreatedAt.IsZero() {
		created = &g.CreatedAt
	}
	if !g.UpdatedAt.IsZero() {
		updated = &g.UpdatedAt
	}

	return &dto.Group{
		ID:        g.ID,
		Name:      g.Name,
		Avatar:    g.Avatar,
		Describe:  g.Describe,
		OwnerId:   g.OwnerId,
		CreatedAt: created,
		UpdatedAt: updated,
	}
}

func BatchConvertGroupPoToDto(groups []*Group) []*dto.Group {
	var res = make([]*dto.Group, 0, len(groups))
	for _, group := range groups {
		res = append(res, group.ConvertDto())
	}
	return res
}

func ConvertGroupDtoToPo(d *dto.Group) *Group {
	var (
		created time.Time
		updated time.Time
	)
	if d.CreatedAt != nil {
		created = *d.CreatedAt
	}
	if d.UpdatedAt != nil {
		updated = *d.UpdatedAt
	}
	return &Group{
		Model:    gorm.Model{ID: d.ID, CreatedAt: created, UpdatedAt: updated},
		Name:     d.Name,
		Avatar:   d.Avatar,
		Describe: d.Describe,
		OwnerId:  d.OwnerId,
	}
}
