package main

import (
	"log/slog"
	"loop_server/infra/mysql"
	"loop_server/infra/vars"
	app_impl "loop_server/internal/application/impl"
	domain_impl "loop_server/internal/domain/impl"
	repo_impl "loop_server/internal/repository/impl"
	server2 "loop_server/internal/server"
	server_impl "loop_server/internal/server/impl"
)

func main() {

	db, err := mysql.InitDB(vars.App.MySQLConfig)
	if err != nil {
		slog.Error("mysql.InitDB(app.MySQLConfig) err:", err)
	}

	userRepo := repo_impl.NewUserRepoImpl(db)
	friendRepo := repo_impl.NewFriendRepoImpl(db)
	groupRepo := repo_impl.NewGroupRepoImpl(db)
	imRepo := repo_impl.NewImRepoImpl(db)

	userDomain := domain_impl.NewUserDomainImpl(userRepo)
	friendDomain := domain_impl.NewFriendDomainImpl(friendRepo)
	groupDomain := domain_impl.NewGroupDomainImpl(groupRepo)
	imDomain := domain_impl.NewImDomainImpl(imRepo)

	userApp := app_impl.NewUserAppImpl(userDomain, friendDomain)
	friendApp := app_impl.NewFriendAppImpl(friendDomain, userDomain)
	groupApp := app_impl.NewGroupAppImpl(groupDomain, userDomain)
	sufApp := app_impl.NewSfuAppImpl(imDomain)
	imApp := app_impl.NewImAppImpl(sufApp, imDomain, groupDomain, userDomain)

	userServer := server_impl.NewUserServerImpl(userApp)
	friendServer := server_impl.NewFriendServerImpl(friendApp)
	groupServer := server_impl.NewGroupServerImpl(groupApp)
	imServer := server_impl.NewImServerImpl(imApp)

	server := server2.NewServer(userServer, friendServer, groupServer, imServer)
	server.InitRouter()
}
