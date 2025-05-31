# Loop - 实时通讯与 AI 聊天应用

Loop 是一个功能完整的实时通讯应用，集成了即时通讯、群组管理、好友系统和 AI 聊天等功能。采用前后端分离架构，提供高性能、可靠的实时通讯服务。

## 在线体验
网页：https://www.loop-im.xin/
（由于云服务器带宽为2Mbps，所以响应会比较慢，还请见谅~）
## 项目结构

```
.
├── loop_server/          # 后端服务
│   └── README.md        # 后端实现文档
└── loop_web/            # 前端应用
    └── README.md        # 前端实现文档
```

## 核心功能

### 用户系统
- 用户注册与登录
- JWT 双 Token 认证（Access Token + Refresh Token）
- 用户信息管理（昵称、头像、个性签名等）

### 好友系统
- 好友添加与删除
- 好友请求管理（发送、接受、拒绝）
- 好友列表管理

### 群组功能
- 群组创建与管理
- 群成员管理（添加、删除、退出）
- 群角色管理（群主、管理员、普通成员）
- 群组权限控制
- 群组信息修改
- 群主转让

### 即时通讯
- 一对一私聊
- 群组聊天
- 消息实时推送
- 离线消息存储与同步
- WebSocket 长连接
- 心跳检测

### 音视频通话
- WebRTC 点对点音视频通话
- 群组音视频通话
- 通话状态管理

### AI 聊天
- 集成 DeepSeek 接口
- 智能对话功能
- 单轮对话支持

## 技术栈

### 后端 (loop_server)
- 语言：Go 1.23
- Web 框架：Gin
- 数据库：MySQL (GORM)
- 缓存：Redis
- WebSocket：Gorilla WebSocket
- 实时通讯：WebRTC (Pion)
- AI 集成：LangChainGo
- 配置管理：Viper
- JWT 认证

### 前端 (loop_web)
- 框架：React 19
- 构建工具：Vite 6
- UI 组件库：Ant Design 5
- 状态管理：MobX 6
- 路由：React Router 7
- 网络请求：Axios
- 实时通讯：WebRTC (react-native-webrtc)
- 本地存储：Dexie (IndexedDB)
- 样式：SASS
- 开发语言：TypeScript

## 快速开始

### 环境要求
- Go 1.23 或更高版本
- MySQL 5.7 或更高版本
- Redis 6.0 或更高版本
- Node.js (前端开发)

### 开发环境搭建

1. 克隆项目
   ```bash
   git clone <repository_url>
   cd loop
   ```

2. 后端服务启动
   ```bash
   cd loop_server
   # 详细说明请参考 loop_server/README.md
   ```

3. 前端服务启动
   ```bash
   cd loop_web
   # 详细说明请参考 loop_web/README.md
   ```

## 开发计划

- 群视频通话
- 细节优化
