package application

import (
	"context"
)

type ImApp interface {
	HandleMessage(ctx context.Context, msgByte []byte) error
}
