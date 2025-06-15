# DiFlow Cursor 集成功能

DiFlow 插件现在支持与 Cursor 编辑器的深度集成，提供以下功能：

## 🚀 主要功能

### 1. Cursor Chat 集成

- **打开 Cursor Chat**: 直接从插件触发 Cursor 的 AI 对话功能
- **代码解释**: 选中代码后，自动发送到 Cursor Chat 进行解释
- **文件审查**: 将整个文件发送到 Cursor Chat 进行代码审查

### 2. Cursor Rules 管理

- **获取规则**: 读取当前工作区的 `.cursorrules` 文件
- **设置规则**: 通过输入框快速设置 Cursor 规则
- **编辑规则**: 在编辑器中直接编辑 `.cursorrules` 文件

### 3. MCP (Model Context Protocol) 配置

- **获取 MCP 设置**: 查看当前的 MCP 配置
- **设置 MCP 配置**: 通过 JSON 格式配置 MCP 参数

### 4. 环境检测

- **检查 Cursor 环境**: 自动检测是否在 Cursor 编辑器中运行

## 📋 使用方法

### 通过命令面板使用

1. 按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS) 打开命令面板
2. 输入 "DiFlow" 查看所有可用命令：

#### Cursor Chat 相关命令

- `DiFlow: 检查 Cursor 环境` - 检测是否在 Cursor 中运行
- `DiFlow: 打开 Cursor Chat` - 打开 Cursor 的 AI 对话界面
- `DiFlow: 用 Cursor 解释代码` - 发送选中代码到 Cursor Chat 解释
- `DiFlow: 用 Cursor 审查文件` - 发送当前文件到 Cursor Chat 审查

#### Cursor Rules 相关命令

- `DiFlow: 获取 Cursor Rules` - 在新标签页中显示当前规则
- `DiFlow: 设置 Cursor Rules` - 通过输入框设置规则
- `DiFlow: 编辑 Cursor Rules` - 在编辑器中编辑 `.cursorrules` 文件

#### MCP 相关命令

- `DiFlow: 获取 MCP 设置` - 查看当前 MCP 配置
- `DiFlow: 设置 MCP 配置` - 设置 MCP 参数
- `DiFlow: 获取工作区 Cursor 设置` - 查看工作区的 Cursor 配置

### 通过右键菜单使用

在编辑器中右键，选择 "DiFlow" 子菜单：

- **用 Cursor 解释代码** - 解释选中的代码
- **用 Cursor 审查文件** - 审查当前文件

## 🔧 技术实现

### 环境检测

插件通过多种方式检测 Cursor 环境：

- 检查应用名称是否包含 "cursor"
- 检查应用根路径
- 检查环境变量 `CURSOR_SESSION_ID`
- 检查 VS Code 注入标识

### Chat 触发机制

插件使用多层降级策略触发 Cursor Chat：

1. **优先方案**: 尝试执行 `cursor.chat.new` 命令
2. **备选方案**: 模拟 `Ctrl+L` 快捷键
3. **降级方案**: 复制消息到剪贴板，提示用户手动触发

### 配置文件管理

- **Cursor Rules**: 读写工作区根目录的 `.cursorrules` 文件
- **全局配置**: 访问 Cursor 的全局配置文件
  - macOS: `~/Library/Application Support/Cursor/User/settings.json`
  - Windows: `%APPDATA%/Cursor/User/settings.json`
  - Linux: `~/.config/Cursor/User/settings.json`

## 🎯 使用场景

### 1. 代码解释

```typescript
// 选中这段代码，然后使用 "用 Cursor 解释代码" 命令
const fibonacci = (n: number): number => {
  return n <= 1 ? n : fibonacci(n - 1) + fibonacci(n - 2);
};
```

### 2. 设置项目规则

通过 "编辑 Cursor Rules" 命令创建 `.cursorrules` 文件：

```
# 项目规则示例
- 使用 TypeScript 进行开发
- 遵循 ESLint 规范
- 优先使用函数式编程风格
- 添加详细的注释说明
```

### 3. MCP 配置示例

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/allowed/files"
      ]
    }
  }
}
```

## ⚠️ 注意事项

1. **环境要求**: 某些功能只在 Cursor 环境中可用
2. **权限问题**: 修改全局配置可能需要相应的文件系统权限
3. **版本兼容**: 不同版本的 Cursor 可能有不同的命令和配置格式
4. **文件大小**: 发送大文件到 Chat 时会有确认提示

## 🔄 更新日志

### v1.2.0

- ✅ 添加 Cursor Chat 集成
- ✅ 支持 Cursor Rules 管理
- ✅ 支持 MCP 配置
- ✅ 添加环境检测功能
- ✅ 支持右键菜单快捷操作

## 🤝 贡献

如果您发现问题或有改进建议，请提交 Issue 或 Pull Request。

## 📄 许可证

本项目采用 MIT 许可证。
