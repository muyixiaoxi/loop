package main

import (
	"log/slog"
	llm2 "loop_server/infra/llm"
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

	llm, err := llm2.InitLLM(vars.App.OpenaiConfig)

	userRepo := repo_impl.NewUserRepoImpl(db)
	friendRepo := repo_impl.NewFriendRepoImpl(db)
	groupRepo := repo_impl.NewGroupRepoImpl(db)
	imRepo := repo_impl.NewImRepoImpl(db)

	userDomain := domain_impl.NewUserDomainImpl(userRepo)
	friendDomain := domain_impl.NewFriendDomainImpl(friendRepo)
	groupDomain := domain_impl.NewGroupDomainImpl(groupRepo)
	imDomain := domain_impl.NewImDomainImpl(imRepo)
	llmDomain := domain_impl.NewLLMDomainImpl(llm)

	userApp := app_impl.NewUserAppImpl(userDomain, friendDomain)
	friendApp := app_impl.NewFriendAppImpl(friendDomain, userDomain, groupDomain)
	groupApp := app_impl.NewGroupAppImpl(groupDomain, userDomain, imDomain)
	sufApp := app_impl.NewSfuAppImpl(imDomain)
	imApp := app_impl.NewImAppImpl(sufApp, imDomain, groupDomain, userDomain, friendDomain)
	llmApp := app_impl.NewLLMAppImpl(llmDomain)

	userServer := server_impl.NewUserServerImpl(userApp)
	friendServer := server_impl.NewFriendServerImpl(friendApp)
	groupServer := server_impl.NewGroupServerImpl(groupApp)
	llmServer := server_impl.NewLLmServerImpl(llmApp)
	imServer := server_impl.NewImServerImpl(imApp)

	server := server2.NewServer(userServer, friendServer, groupServer, imServer, llmServer)
	server.InitRouter()
}
