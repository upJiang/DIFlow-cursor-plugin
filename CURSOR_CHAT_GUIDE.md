# Cursor Chat 集成指南

## 🎯 Cursor 聊天功能说明

Cursor 编辑器的AI聊天功能是其核心特性之一。本插件提供了多种方式来打开和使用Cursor Chat。

## 🔧 支持的聊天触发方式

### 1. 快捷键方式（推荐）

- **macOS**: `Cmd + L`
- **Windows/Linux**: `Ctrl + L`

这是Cursor官方的标准快捷键，直接打开AI聊天界面。

### 2. 命令方式

插件尝试执行以下命令（按优先级排序）：

#### Cursor 特有命令

```
aichat.newchat              # Cursor AI聊天新对话
cursor.chat.new             # 新建聊天
cursor.chat.focus           # 聚焦聊天界面
cursor.chat.open            # 打开聊天
aichat.newchataction        # AI聊天动作
cursor.newChat              # 新聊天（备用）
cursor.openChat             # 打开聊天（备用）
cursor.ai.chat              # AI聊天
cursor.ai.newChat           # AI新聊天
```

#### GitHub Copilot 兼容命令

```
github.copilot.chat.open                    # 打开Copilot聊天
github.copilot.interactiveEditor.explain   # 交互式解释
github.copilot.chat.newChat                # 新建Copilot聊天
```

#### VS Code 通用聊天命令

```
workbench.action.chat.open          # 打开聊天
workbench.action.chat.newChat       # 新建聊天
workbench.action.chat.openInSidebar # 在侧边栏打开聊天
workbench.action.chat.openInPanel   # 在面板打开聊天
workbench.action.chat.focus         # 聚焦聊天
```

### 3. 命令面板方式

如果直接命令失败，插件会尝试：

1. 打开命令面板 (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. 输入 ">chat"
3. 选择聊天相关命令

## 🚀 使用方法

### 从DIFlow插件使用

1. **打开Cursor管理界面**

   - 命令面板: `DiFlow: Cursor 管理`
   - 或点击侧边栏的DIFlow图标

2. **使用QuickChat功能**

   - 在"快捷对话"标签页中输入消息
   - 点击"发送到Chat"按钮
   - 插件会自动打开Cursor Chat并发送消息

3. **仅打开聊天界面**
   - 点击"打开Chat"按钮
   - 不发送消息，仅打开聊天界面

### 直接使用快捷键

在Cursor编辑器中，直接按：

- **macOS**: `Cmd + L`
- **Windows/Linux**: `Ctrl + L`

## 🔍 故障排除

### 问题1: "发送消息失败，请检查 Cursor Chat 是否可用"

**可能原因**：

1. 当前不在Cursor编辑器环境中
2. Cursor版本不支持某些命令
3. 聊天功能被禁用或未正确配置

**解决方案**：

1. 确认在Cursor编辑器中运行（不是VS Code）
2. 手动尝试 `Cmd+L` / `Ctrl+L` 快捷键
3. 检查Cursor设置中的AI功能是否启用
4. 更新到最新版本的Cursor

### 问题2: 聊天界面打开但消息未发送

**可能原因**：

1. 聊天界面未完全加载
2. 输入框未获得焦点
3. 消息格式问题

**解决方案**：

1. 等待聊天界面完全加载后再发送
2. 手动点击聊天输入框
3. 检查消息内容是否包含特殊字符

### 问题3: 在VS Code中无法使用

**说明**：
Cursor特有的命令在标准VS Code中不可用。如果在VS Code中使用，插件会尝试：

1. GitHub Copilot命令（如果安装了Copilot扩展）
2. VS Code内置聊天命令
3. 其他兼容的AI聊天扩展命令

## 📝 最佳实践

### 1. 消息格式建议

```
简洁明确的问题描述
- 包含足够的上下文
- 避免过长的消息（建议<2000字符）
- 使用清晰的标点符号
```

### 2. 使用场景

- **代码解释**: 选中代码后发送到聊天
- **代码审查**: 发送整个文件进行审查
- **问题求助**: 描述遇到的编程问题
- **代码优化**: 请求代码改进建议

### 3. 提高成功率的技巧

1. 确保Cursor编辑器处于活动状态
2. 在发送消息前先手动测试快捷键
3. 消息不要过于复杂，分批发送
4. 保持网络连接稳定

## 🔄 更新日志

### v1.1.1

- ✅ 支持多种Cursor聊天命令
- ✅ 添加快捷键模拟功能
- ✅ 改进错误处理和用户反馈
- ✅ 支持消息直接发送到聊天

### 待开发功能

- 🔲 支持聊天历史记录
- 🔲 支持多轮对话上下文
- 🔲 支持文件拖拽到聊天
- 🔲 支持代码块高亮发送

## 💡 技术说明

插件使用多层降级策略确保最大兼容性：

1. **优先级1**: Cursor原生命令
2. **优先级2**: 快捷键模拟
3. **优先级3**: 命令面板操作
4. **优先级4**: 兼容性命令
5. **降级方案**: 复制到剪贴板 + 用户手动操作

这种设计确保在各种环境和版本下都能提供最佳的用户体验。
