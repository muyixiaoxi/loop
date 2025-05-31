package repository

import (
	"context"
	"loop_server/internal/model/po"
)

type ImRepo interface {
	SaveGroupMessage(ctx context.Context, pMsg *po.GroupMessage) error
	GetOfflineGroupMessage(ctx context.Context, groupId uint, userId uint) ([]*po.GroupMessage, error)
	GetGroupMessageBySeqId(ctx context.Context, seqId string) (*po.GroupMessage, error)
	UpdateGroupMessageLastSeqId(ctx context.Context, groupId uint, userId uint, seqId string) error
}
