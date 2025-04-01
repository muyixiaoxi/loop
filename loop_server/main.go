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
	userDomain := domain_impl.NewUserDomainImpl(userRepo)
	userApp := app_impl.NewUserAppImpl(userDomain)

	server := server.NewServer(userApp)
	server.Init()
}
