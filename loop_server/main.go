package main

import (
	"log/slog"
	"loop_server/infra/mysql"
	"loop_server/infra/vars"
	app_impl "loop_server/internal/application/impl"
	domain_impl "loop_server/internal/domain/impl"
	repo_impl "loop_server/internal/repository/impl"
	"loop_server/internal/server"
	server_impl "loop_server/internal/server/impl"
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
	imDomain := domain_impl.NewImDomainImpl()

	userApp := app_impl.NewUserAppImpl(userDomain, friendDomain)
	friendApp := app_impl.NewFriendAppImpl(friendDomain, userDomain)
	imApp := app_impl.NewImAppImpl(imDomain)

	userServer := server_impl.NewUserServerImpl(userApp)
	friendServer := server_impl.NewFriendServerImpl(friendApp)
	imServer := server_impl.NewImServerImpl(imApp)

	server := server.NewServer(userServer, friendServer, imServer)
	server.Init()
}
