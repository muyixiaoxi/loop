package impl

import (
	"context"
	"encoding/json"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"log/slog"
	"loop_server/infra/consts"
	"loop_server/internal/model/dto"
	"loop_server/internal/model/po"
	"time"
)

type groupRepoImpl struct {
	db *gorm.DB
}

func NewGroupRepoImpl(db *gorm.DB) *groupRepoImpl {
	return &groupRepoImpl{db: db}
}

func (g *groupRepoImpl) CreateGroup(ctx context.Context, dto *dto.Group, userIds []uint) (*dto.Group, *po.GroupMessage, error) {
	group := po.ConvertGroupDtoToPo(dto)
	tx := g.db.WithContext(ctx).Begin()
	err := tx.Create(group).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go Create err:", err)
		tx.Rollback()
		return nil, nil, err
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
		return nil, nil, err
	}

	uIds, _ := json.Marshal(userIds)
	msg := &po.GroupMessage{
		GroupId:     group.ID,
		SeqId:       uuid.New().String(),
		SenderId:    group.OwnerId,
		Content:     "",
		ReceiverIds: string(uIds),
		Type:        consts.GroupMessageTypeInvite,
		SendTime:    time.Now().UnixMilli(),
	}

	// 创建系统消息
	err = tx.Create(msg).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go Create err:", err)
		tx.Rollback()
		return nil, nil, err
	}

	err = tx.Commit().Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go Create err:", err)
		tx.Rollback()
		return nil, nil, err
	}
	return group.ConvertDto(), msg, err
}

func (g *groupRepoImpl) UpdateGroup(ctx context.Context, dt *dto.Group) (*dto.Group, error) {
	group := po.ConvertGroupDtoToPo(dt)
	err := g.db.WithContext(ctx).Updates(group).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go UpdateGroup err:", err)
		return nil, err
	}
	return group.ConvertDto(), nil
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
	err := g.db.WithContext(ctx).Model(&group).Joins("join group_ship on group_ship.group_id = group.id and group_ship.deleted_at is null and group_ship.user_id = ?", userId).Find(&group).Error
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
	err := g.db.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "group_id"}, {Name: "user_id"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"deleted_at": gorm.Expr("NULL"),
		}),
	}).Create(poShip).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go AddMember err:", err)
		return err
	}
	return nil
}

func (g *groupRepoImpl) DeleteMember(ctx context.Context, groupId uint, userIds []uint, role uint) error {
	err := g.db.WithContext(ctx).Where("group_id = ? and role < ? and user_id in ?", groupId, role, userIds).Delete(&po.GroupShip{}).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go DeleteMember err:", err)
		return err
	}
	return nil
}

func (g *groupRepoImpl) GetGroupShipByUserId(ctx context.Context, groupId, userId uint) (*dto.GroupShip, error) {
	var ship po.GroupShip
	err := g.db.WithContext(ctx).Where("group_id = ? and user_id = ?", groupId, userId).Find(&ship).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go GetGroupUser err:", err)
		return nil, err
	}
	return ship.ConvertToDto(), nil
}

func (g *groupRepoImpl) GetGroupShipByRole(ctx context.Context, groupId, role uint) ([]*dto.GroupShip, error) {
	var ship []*po.GroupShip
	err := g.db.WithContext(ctx).Where("group_id = ? and role = ?", groupId, role).Find(&ship).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go GetGroupUser err:", err)
		return nil, err
	}
	data := make([]*dto.GroupShip, 0, len(ship))
	for _, groupShip := range ship {
		data = append(data, groupShip.ConvertToDto())
	}
	return data, nil
}

func (g *groupRepoImpl) GetGroupShip(ctx context.Context, groupId uint) ([]*dto.GroupShip, error) {
	var ship []*po.GroupShip
	err := g.db.WithContext(ctx).Where("group_id = ?", groupId).Find(&ship).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go GetGroupUser err:", err)
		return nil, err
	}
	data := make([]*dto.GroupShip, 0, len(ship))
	for _, groupShip := range ship {
		data = append(data, groupShip.ConvertToDto())
	}
	return data, nil
}

func (g *groupRepoImpl) GetGroupShipByLessRole(ctx context.Context, groupId uint, role uint) ([]*dto.GroupShip, error) {
	var ship []*po.GroupShip
	err := g.db.WithContext(ctx).Where("group_id = ? and role < ?", groupId, role).Find(&ship).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go GetGroupUser err:", err)
		return nil, err
	}
	data := make([]*dto.GroupShip, 0, len(ship))
	for _, groupShip := range ship {
		data = append(data, groupShip.ConvertToDto())
	}
	return data, nil
}

func (g *groupRepoImpl) AddAdmin(ctx context.Context, groupId uint, userIds []uint) error {
	err := g.db.Debug().WithContext(ctx).Model(&po.GroupShip{}).Where("group_id = ? and user_id in ?", groupId, userIds).Update("role", consts.GroupRoleAdmin).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go AddAdmin err:", err)
		return err
	}
	return nil
}

func (g *groupRepoImpl) DeleteAdmin(ctx context.Context, groupId, userId uint) error {
	err := g.db.WithContext(ctx).Model(&po.GroupShip{}).Where("group_id = ? and user_id = ?", groupId, userId).Update("role", consts.GroupRoleMember).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go DeleteAdmin err:", err)
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

func (g *groupRepoImpl) TransferGroupOwner(ctx context.Context, groupId uint, curOwner, userId uint) error {
	tx := g.db.WithContext(ctx).Begin()
	err := tx.Model(&po.GroupShip{}).Where("group_id = ? and user_id = ?", groupId, userId).Update("role", consts.GroupRoleOwner).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go TransferGroupOwner err:", err)
		tx.Rollback()
		return err
	}
	err = tx.Model(&po.GroupShip{}).Where("group_id = ? and user_id = ?", groupId, curOwner).Update("role", consts.GroupRoleMember).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go TransferGroupOwner err:", err)
		tx.Rollback()
		return err
	}
	err = tx.Model(&po.Group{}).Where("id = ?", groupId).Update("owner_id", userId).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go TransferGroupOwner err:", err)
		tx.Rollback()
		return err
	}
	tx.Commit()
	return nil
}
