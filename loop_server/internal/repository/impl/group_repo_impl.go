package impl

import (
	"context"
	"gorm.io/gorm"
	"log/slog"
	"loop_server/infra/consts"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/po"
)

type groupRepoImpl struct {
	db *gorm.DB
}

func NewGroupRepoImpl(db *gorm.DB) *groupRepoImpl {
	return &groupRepoImpl{db: db}
}

func (g *groupRepoImpl) CreateGroup(ctx context.Context, dto *dto.Group, userIds []uint) (*dto.Group, error) {
	group := po.ConvertGroupDtoToPo(dto)
	tx := g.db.WithContext(ctx).Begin()
	err := tx.Create(group).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go Create err:", err)
		tx.Rollback()
		return nil, err
	}
	ships := make([]*po.GroupShip, 0, len(userIds)+1)
	for _, id := range userIds {
		if id == dto.OwnerId {
			continue
		}
		ships = append(ships, &po.GroupShip{
			GroupId: group.ID,
			UserId:  id,
			Role:    consts.GroupRoleMember,
		})
	}
	ships = append(ships, &po.GroupShip{
		GroupId: group.ID,
		UserId:  dto.OwnerId,
		Role:    consts.GroupRoleOwner,
	})
	err = tx.Create(ships).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go Create err:", err)
		tx.Rollback()
		return nil, err
	}
	tx.Create(&po.GroupMessage{})

	err = tx.Commit().Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go Create err:", err)
		tx.Rollback()
		return nil, err
	}
	return group.ConvertDto(), err
}

func (g *groupRepoImpl) DeleteGroup(ctx context.Context, groupId uint) error {
	tx := g.db.WithContext(ctx).Begin()
	err := tx.Where("id = ?", groupId).Delete(&po.Group{}).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go DeleteGroup err:", err)
		tx.Rollback()
		return err
	}
	err = tx.Where("group_id = ?", groupId).Delete(&po.GroupShip{}).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go DeleteGroup err:", err)
		tx.Rollback()
		return err
	}
	tx.Commit()
	return nil
}

func (g *groupRepoImpl) GetGroupList(ctx context.Context, userId uint) ([]*dto.Group, error) {
	var group []*po.Group
	err := g.db.WithContext(ctx).Model(&group).Joins("join group_ship on group_ship.group_id = group.id and group_ship.user_id = ?", userId).Find(&group).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go GetGroupList err:", err)
		return nil, err
	}

	return po.BatchConvertGroupPoToDto(group), nil
}

func (g *groupRepoImpl) GetGroup(ctx context.Context, groupId uint) (*dto.Group, error) {
	var group po.Group
	err := g.db.WithContext(ctx).Where("id = ?", groupId).Find(&group).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go GetGroup err:", err)
		return nil, err
	}
	return group.ConvertDto(), nil
}

func (g *groupRepoImpl) AddMember(ctx context.Context, ship []*dto.GroupShip) error {
	poShip := make([]*po.GroupShip, 0, len(ship))
	for _, s := range ship {
		poShip = append(poShip, po.ConvertGroupShipDtoToPo(s))
	}
	err := g.db.WithContext(ctx).Model(&po.GroupShip{}).Create(poShip).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go AddMember err:", err)
		return err
	}
	return nil
}

func (g *groupRepoImpl) DeleteMember(ctx context.Context, groupId uint, userId uint) error {
	err := g.db.WithContext(ctx).Where("group_id = ? and user_id = ?", groupId, userId).Delete(&po.GroupShip{}).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go DeleteMember err:", err)
		return err
	}
	return nil
}

func (g *groupRepoImpl) GetGroupShip(ctx context.Context, groupId, userId uint) (*dto.GroupShip, error) {
	var ship po.GroupShip
	err := g.db.WithContext(ctx).Where("group_id = ? and user_id = ?", groupId, userId).Find(&ship).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go GetGroupUser err:", err)
		return nil, err
	}
	return ship.ConvertToDto(), nil
}

func (g *groupRepoImpl) AddAdmin(ctx context.Context, groupId, userId uint) error {
	err := g.db.WithContext(ctx).Model(&po.GroupShip{}).Where("group_id = ? and user_id = ? and role != ?", groupId, userId, consts.GroupRoleOwner).Update("role", consts.GroupRoleAdmin).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go AddAdmin err:", err)
		return err
	}
	return nil
}

func (g *groupRepoImpl) GetGroupUserId(ctx context.Context, groupId uint) ([]uint, error) {
	var userId []uint
	err := g.db.WithContext(ctx).Model(&po.GroupShip{}).Where("group_id = ?", groupId).Select("user_id").Find(&userId).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go GetGroupUserId err:", err)
		return nil, err
	}
	return userId, nil
}
