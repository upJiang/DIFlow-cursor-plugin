# DIFlow 开发指南

## 快速开始

### 安装依赖

```bash
yarn setup
```

### 启动开发环境

```bash
# 启动所有服务（推荐）
yarn dev:all

# 或者分别启动
yarn dev:server  # 启动后端服务器
yarn dev:webview # 启动前端webview
```

## 开发服务

### 服务端口

- **后端服务器**: http://localhost:3001
- **前端Webview**: http://localhost:7979

### 可用端点

- **健康检查**: http://localhost:3001/diflow/health
- **Swagger文档**: http://localhost:3001/diflow/api
- **认证登录**: http://localhost:3001/diflow/auth/login

### 健康检查功能

项目包含完整的服务器健康检查功能：

1. **自动端口检测**: 自动检测端口占用情况
2. **进程清理**: 自动清理占用端口的进程
3. **健康状态监控**: 检查所有服务端点的可用性
4. **错误处理**: 完整的错误处理和日志记录

### 开发脚本说明

#### `dev-all.js`

综合启动脚本，功能包括：

- 自动检测并清理端口占用
- 按顺序启动服务器和webview
- 执行健康检查
- 优雅的进程管理和清理

#### `dev-webview.js`

Webview开发服务器，功能包括：

- 端口占用检测和清理
- 自动启动前端开发服务器
- 健康检查和状态监控

#### `server/dev-server.js`

后端开发服务器，功能包括：

- Express服务器启动
- API路由配置
- Swagger文档服务

## 构建和部署

### 构建插件

```bash
yarn vscode:prepublish
```

### 构建所有组件

```bash
yarn build:all
```

## 故障排除

### 端口占用问题

如果遇到端口占用问题，开发脚本会自动处理：

1. 检测端口占用
2. 终止占用进程
3. 重新启动服务

### 手动清理端口

```bash
# 清理3001端口
lsof -ti:3001 | xargs kill -9

# 清理7979端口
lsof -ti:7979 | xargs kill -9
```

### 服务健康检查

```bash
# 检查服务器健康状态
curl http://localhost:3001/diflow/health

# 检查webview状态
curl http://localhost:7979

# 检查Swagger文档
curl http://localhost:3001/diflow/api
```

## 开发注意事项

1. **端口配置**: 确保3001和7979端口可用
2. **进程管理**: 使用Ctrl+C优雅关闭所有服务
3. **热重载**: webview支持热重载，修改代码后自动刷新
4. **错误处理**: 所有脚本都包含完整的错误处理
5. **日志记录**: 详细的启动和运行日志

## 技术栈

- **后端**: Node.js + Express
- **前端**: Vue 3 + Vite
- **插件**: VS Code Extension API
- **构建**: Webpack + Vite
- **开发工具**: TypeScript + ESLint
