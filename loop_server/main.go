package main

import (
	"log/slog"
	"loop_server/infra/mysql"
	"loop_server/infra/vars"
	app_impl "loop_server/internal/application/impl"
	domain_impl "loop_server/internal/domain/impl"
	repo_impl "loop_server/internal/repository/impl"
	"loop_server/internal/server"
)

func main() {

	db, err := mysql.InitDB(vars.App.MySQLConfig)
	if err != nil {
		slog.Error("mysql.InitDB(app.MySQLConfig) err:", err)
	}

	userRepo := repo_impl.NewUserRepoImpl(db)
	friendRepo := repo_impl.NewFriendRepoImpl(db)

	userDomain := domain_impl.NewUserDomainImpl(userRepo)
	friendDomain := domain_impl.NewFriendDomainImpl(friendRepo)

	userApp := app_impl.NewUserAppImpl(userDomain, friendDomain)
	friendApp := app_impl.NewFriendAppImpl(friendDomain)

	server := server.NewServer(userApp, friendApp)
	server.Init()
}
