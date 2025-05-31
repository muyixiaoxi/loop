# Loop Server

Loop 的后端服务，提供实时通讯、用户管理、群组管理、AI 聊天等功能的 API 服务。

## 技术栈

- 语言：Go
- Web 框架：Gin
- 数据库：MySQL
- 缓存：Redis
- WebSocket：Gorilla WebSocket
- 实时通讯：WebRTC (SFU)
- AI 集成：OpenAI
- 配置管理：YAML

## 目录结构

```
loop_server/
├── infra/                 # 基础设施层
│   ├── consts/           # 常量定义
│   ├── llm/              # AI 模型集成
│   ├── middleware/       # 中间件
│   ├── mysql/            # MySQL 数据库
│   ├── redis/            # Redis 缓存
│   ├── sfu/              # WebRTC SFU 服务
│   ├── vars/             # 全局变量
│   └── ws/               # WebSocket 服务
├── internal/             # 内部包
│   ├── application/      # 应用层
│   │   └── impl/        # 应用层实现
│   ├── domain/          # 领域层
│   │   └── impl/        # 领域层实现
│   ├── model/           # 数据模型
│   ├── repository/      # 仓储层
│   │   └── impl/        # 仓储层实现
│   └── server/          # 服务器层
│       └── impl/        # 服务器层实现
├── config.yaml          # 配置文件
├── go.mod              # Go 模块文件
├── go.sum              # Go 依赖版本锁定
└── main.go             # 主程序入口
```

## 核心功能

### 用户系统
- 用户注册与登录
- 用户信息管理

### 好友系统
- 好友添加与删除
- 好友请求管理
- 好友列表管理

### 群组功能
- 群组创建与管理
- 群成员管理
- 群组权限控制

### 即时通讯
- 一对一私聊
- 群组聊天
- 消息实时推送
- WebSocket 长连接

### 音视频通话
- WebRTC 点对点音视频通话
- SFU 服务器转发

### AI 聊天
- 集成 OpenAI 接口
- 智能对话功能

## 开发环境

1. 克隆项目
   ```bash
   git clone <repository_url>
   cd loop_server
   ```

2. 安装依赖
   ```bash
   go mod download
   ```

3. 配置
   - 复制并修改 config.yaml 配置文件
   - 配置必要的环境变量

4. 运行服务
   ```bash
   go run main.go
   ```

## 部署说明

1. 构建
   ```bash
   go build -o loop_server
   ```

2. 运行
   ```bash
   ./loop_server
   ```

## 开发指南

### 代码规范
- 遵循 Go 标准代码规范
- 使用 gofmt 格式化代码
- 编写单元测试

### 提交规范
- feat: 新功能
- fix: 修复问题
- docs: 文档修改
- style: 代码格式修改
- refactor: 代码重构
- test: 测试用例修改
- chore: 其他修改

## 更新日志

### v1.0.0 (2024-03-xx)
- 初始版本发布
- 实现基础功能：
  - 用户系统
  - 好友系统
  - 群组功能
  - 即时通讯
  - AI 聊天
  - 音视频通话 