package impl

import (
	"context"
	"gorm.io/gorm"
	"log/slog"
	"loop_server/internal/model/po"
)

type imRepoImpl struct {
	db *gorm.DB
}

func NewImRepoImpl(db *gorm.DB) *imRepoImpl {
	return &imRepoImpl{db: db}
}

func (g *imRepoImpl) SaveGroupMessage(ctx context.Context, pMs *po.GroupMessage) error {
	if err := g.db.WithContext(ctx).Create(&pMs).Error; err != nil {
		slog.Error("groupRepoImpl.SaveGroupMessage error")
		return err
	}
	return nil
}

func (g *imRepoImpl) GetOfflineGroupMessage(ctx context.Context, groupId uint, userId uint) ([]*po.GroupMessage, error) {
	var data []*po.GroupMessage
	err := g.db.WithContext(ctx).
		Model(&po.GroupMessage{}).
		Where("group_id = ?", groupId).
		Where("sender_id != ? and id > (SELECT gm.id FROM group_message gm JOIN group_ship gs ON gm.seq_id = gs.last_ack_seq_id "+
			"WHERE gs.group_id = ? AND gs.user_id = ?)", userId, groupId, userId).
		Find(&data).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go GetOfflineGroupMessage err:", err)
		return nil, err
	}
	return data, nil
}

func (g *imRepoImpl) GetGroupMessageBySeqId(ctx context.Context, seqId string) (*po.GroupMessage, error) {
	data := &po.GroupMessage{}
	err := g.db.WithContext(ctx).Where("seq_id = ?", seqId).First(&data).Error
	if err != nil {
		slog.Error("internal/repository/impl/group_repo_impl.go GetGroupMessageBySeqId err:", err)
		return nil, err
	}
	return data, nil
}

func (g *imRepoImpl) UpdateGroupMessageLastSeqId(ctx context.Context, groupId uint, userId uint, seqId string) error {
	err := g.db.WithContext(ctx).Model(&po.GroupShip{}).Where("group_id = ? AND user_id = ?", groupId, userId).Update("last_ack_seq_id", seqId).Error
	if err != nil {
		slog.Error("groupRepoImpl.SubGroupMessageLastSeqId error")
		return err
	}
	return nil
}
