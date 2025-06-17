# Cursor 用户信息获取测试

## 测试目标

验证改进后的 `getCursorUserInfo` 方法能够正确从 Cursor 的 SQLite 数据库中读取用户登录信息，特别是邮箱 `mp1wx0lc6fc7jt0@outlook.com`。

## 新功能特性

1. **SQLite 数据库读取**：直接从 `state.vscdb` 数据库读取认证信息
2. **多平台支持**：支持 macOS、Windows 和 Linux 的不同数据库路径
3. **备用方法**：如果数据库读取失败，自动回退到 settings.json 读取
4. **会员类型检测**：能够识别用户的会员类型（如 pro）

## 数据库位置

- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/state.vscdb`
- **Windows**: `~/AppData/Roaming/Cursor/User/globalStorage/state.vscdb`
- **Linux**: `~/.config/Cursor/User/globalStorage/state.vscdb`

## 测试步骤

### 1. 启动插件开发环境

```bash
# 在 VS Code 中按 F5 启动插件开发环境
```

### 2. 打开 Cursor 管理页面

- 按 `Cmd+Shift+P` 打开命令面板
- 输入 "DiFlow: Cursor Management"
- 选择命令打开 Cursor 管理页面

### 3. 验证用户信息显示

在 Cursor 管理页面中，应该能看到：

- ✅ 用户邮箱：`mp1wx0lc6fc7jt0@outlook.com`
- ✅ 会员类型：`pro`
- ✅ 登录状态：已登录

### 4. 检查控制台日志

打开开发者工具控制台，应该能看到类似的日志：

```
=== 开始获取 Cursor 用户信息 ===
SQLite 数据库路径: /Users/mac/Library/Application Support/Cursor/User/globalStorage/state.vscdb
✅ 找到 Cursor SQLite 数据库
数据库查询结果: cursorAuth/cachedEmail|mp1wx0lc6fc7jt0@outlook.com
cursorAuth/stripeMembershipType|pro
cursorAuth/accessToken|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
cursorAuth/refreshToken|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
解析的认证数据: {
  "cursorAuth/cachedEmail": "mp1wx0lc6fc7jt0@outlook.com",
  "cursorAuth/stripeMembershipType": "pro",
  "cursorAuth/accessToken": "...",
  "cursorAuth/refreshToken": "..."
}
=== 最终检测结果 ===
邮箱: mp1wx0lc6fc7jt0@outlook.com
会员类型: pro
登录状态: true
```

## 预期结果

- [x] 能够成功检测到用户已登录
- [x] 正确显示用户邮箱：`mp1wx0lc6fc7jt0@outlook.com`
- [x] 正确显示会员类型：`pro`
- [x] 同步按钮应该可用（不再显示"请先登录 Cursor"）

## 错误处理测试

### 1. 数据库不存在的情况

如果 SQLite 数据库文件不存在，应该：

- 显示相应的错误日志
- 自动回退到 settings.json 读取方法
- 如果两种方法都失败，返回未登录状态

### 2. SQLite 命令不可用的情况

如果系统没有安装 sqlite3 命令行工具，应该：

- 捕获执行错误
- 自动回退到 settings.json 读取方法
- 在控制台显示相应的错误信息

## 技术实现细节

### SQLite 查询

```sql
SELECT key, value
FROM ItemTable
WHERE key LIKE 'cursorAuth/%'
```

### 认证数据字段

- `cursorAuth/cachedEmail`: 用户邮箱
- `cursorAuth/stripeMembershipType`: 会员类型
- `cursorAuth/accessToken`: 访问令牌
- `cursorAuth/refreshToken`: 刷新令牌

### 备用方法

如果 SQLite 读取失败，会回退到原来的 settings.json 读取方法，搜索以下字段：

- 直接字段搜索
- 深度搜索包含 @ 符号的字段

## 注意事项

1. 确保系统已安装 sqlite3 命令行工具
2. 确保 Cursor 应用已经登录
3. 数据库文件路径可能因 Cursor 版本而异
4. 访问令牌和刷新令牌是敏感信息，仅用于验证登录状态

## 📝 测试报告模板

请在测试后填写以下信息：

```
测试时间：____
VS Code 版本：____
Cursor 版本：____

测试结果：
□ 成功检测到用户邮箱
□ 成功检测到用户名
□ 界面正确显示用户信息
□ 同步功能正常工作

调试日志关键信息：
- 配置文件路径：____
- 检测到的邮箱：____
- 检测到的用户名：____
- 使用的字段：____

问题描述（如有）：
____

建议改进：
____
```

## 🚀 下一步

如果测试成功：

1. 测试云同步功能
2. 验证跨设备同步
3. 测试错误处理机制

如果测试失败：

1. 提供调试日志
2. 分享配置文件内容（去除敏感信息）
3. 描述具体的错误现象

---

**注意：** 改进后的方法包含了全面的调试信息，即使检测失败也能提供足够的信息来定位问题所在。
