package po

import (
	"gorm.io/gorm"
	"loop_server/internal/model/dto"
)

type GroupShip struct {
	gorm.Model
	GroupId      uint   `gorm:"type:bigint;not null;comment:群组id;uniqueIndex:idx_group_id_user_id"`
	UserId       uint   `gorm:"type:bigint;not null;comment:用户id;uniqueIndex:idx_group_id_user_id"`
	Role         uint   `gorm:"type:tinyint;not null;comment:1-普通成员，2-管理员，3-群主"`
	Remark       string `gorm:"type:varchar(16);not null;comment:备注"`
	GroupRemark  string `gorm:"type:varchar(16);not null;comment:群备注"`
	LastAckSeqId string `gorm:"type:varchar(64);not null;comment:最后确认的消息id"`
}

func (g *GroupShip) TableName() string {
	return "group_ship"
}

func ConvertGroupShipDtoToPo(dto *dto.GroupShip) *GroupShip {
	return &GroupShip{
		Model: gorm.Model{
			ID:        dto.ID,
			CreatedAt: dto.CreatedAt,
			UpdatedAt: dto.UpdatedAt,
		},
		GroupId:     dto.GroupId,
		UserId:      dto.UserId,
		Role:        dto.Role,
		Remark:      dto.Remark,
		GroupRemark: dto.GroupRemark,
	}
}

func (g *GroupShip) ConvertToDto() *dto.GroupShip {
	return &dto.GroupShip{
		ID:        g.ID,
		CreatedAt: g.CreatedAt,
		UpdatedAt: g.UpdatedAt,
		GroupId:   g.GroupId,
		UserId:    g.UserId,
		Role:      g.Role,
		Remark:    g.Remark,
	}
}
