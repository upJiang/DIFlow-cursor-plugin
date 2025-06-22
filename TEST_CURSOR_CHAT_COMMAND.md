# Cursor Chat 命令测试

## 测试目标

测试 `DiFlow.openCursorChat` 命令的功能，确保能够正确打开 Cursor Chat 界面并输入指定消息。

## 测试前提

1. 确保使用的是 Cursor 环境（不是 VS Code）
2. 确保 DIFlow 插件已安装并激活
3. 确保有网络连接（如果需要）

## 命令注册

```typescript
// 在 src/commands/cursorIntegration.ts 中
// 调用 CursorIntegration.openCursorChat() 方法
commands.registerCommand("DiFlow.openCursorChat", async () => {
  const cursorIntegration = new CursorIntegration();
  const result = await cursorIntegration.openCursorChat("111");
  console.log("OpenCursorChat result:", result);
});
```

## 最新改进 (2024-01-XX)

**Done** - 优化了 openCursorChat 方法实现

- 移除了不存在的 `workbench.action.chat.focus` 命令
- 简化了消息发送策略，使用两种方法：
  1. 直接粘贴剪贴板内容
  2. 模拟键盘输入文本
- 改善了用户反馈，明确告知用户需要手动按 Enter 发送
- 添加了更好的错误处理和用户提示

**Done** - 添加了自动发送功能

- 新增 `autoSend` 参数，默认为 `true`，支持自动发送消息
- 实现了三种自动发送策略：
  1. Enter 键发送
  2. Cmd/Ctrl + Enter 组合键发送
  3. 提交命令发送 (`workbench.action.chat.submit` 等)
- 如果自动发送失败，会提示用户手动发送
- 提供了更精确的操作反馈和状态提示

**Done** - 增强了自动发送功能

- 扩展到6种自动发送策略，提高发送成功率：
  1. Enter 键发送（增加等待时间到1.5秒）
  2. Shift + Enter 组合键发送
  3. 提交命令发送（增加更多命令选项）
  4. 键盘快捷键组合
  5. 模拟按键序列（多次 Enter 键）
  6. 焦点切换后发送
- 增加了消息输入功能，支持用户输入自定义消息
- 优化了错误处理和用户反馈机制

## 测试方法

### 方法1：通过命令面板

1. 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入 "DiFlow.openCursorChat"
3. 按回车执行

### 方法2：通过 DIFlow 管理界面

1. 打开 DIFlow 管理面板
2. 找到 "Cursor 管理" 部分
3. 点击 "打开 Cursor 对话" 按钮

### 方法3：通过侧边栏

1. 在侧边栏找到 DIFlow 相关视图
2. 查找 Cursor Chat 相关选项
3. 点击执行

## 预期结果

### 成功情况

- **完全成功**：消息输入并自动发送成功，显示提示 "消息已发送到 Cursor Chat"
- **部分成功**：消息输入成功但自动发送失败，显示 "消息已输入到 Cursor Chat，但自动发送失败，请手动按 Enter 发送"
- **输入成功**：消息输入成功但未启用自动发送，显示 "消息已输入到 Cursor Chat，请按 Enter 发送"
- **界面打开**：聊天界面打开但消息输入失败，显示 "聊天界面已打开，消息已复制到剪贴板，请手动粘贴并发送"

### 失败情况

- **完全失败**：显示 "聊天界面未能自动打开，消息已复制到剪贴板。请使用 Cmd+L (macOS) 或 Ctrl+L (Windows/Linux) 打开聊天界面，然后粘贴消息。"
- **错误**：显示具体的错误信息

## 成功指标

1. ✅ 命令能够正常执行而不报错
2. ✅ 能够打开 Cursor Chat 界面
3. ✅ 消息能够输入到聊天框中
4. ✅ 显示适当的用户提示信息

## 失败指标

1. ❌ 命令执行时抛出异常
2. ❌ 无法打开 Cursor Chat 界面
3. ❌ 消息无法输入到聊天框
4. ❌ 没有任何用户反馈

## 常见问题排查

### 问题1：命令不存在

- **症状**：执行命令时提示 "command not found"
- **解决**：检查命令是否在 package.json 中正确注册

### 问题2：聊天界面无法打开

- **症状**：所有打开命令都失败
- **解决**：
  1. 确认使用的是 Cursor 而不是 VS Code
  2. 检查 Cursor 版本是否支持相关命令
  3. 手动使用 Cmd+L 或 Ctrl+L 测试

### 问题3：消息无法输入

- **症状**：界面打开但消息没有出现
- **解决**：
  1. 检查剪贴板是否包含正确内容
  2. 手动粘贴测试
  3. 检查聊天界面是否处于正确状态

## 调试信息

在开发者控制台中查看以下日志：

```
[DEBUG] 开始执行 openCursorChat，消息: reward 自动发送: true
[DEBUG] 将消息复制到剪贴板...
[DEBUG] 消息已复制到剪贴板
[DEBUG] 尝试打开聊天界面...
[DEBUG] 尝试命令: aichat.newchataction
[DEBUG] 成功执行命令: aichat.newchataction
[DEBUG] 等待聊天界面加载...
[DEBUG] 开始发送消息...
[DEBUG] 尝试策略1: 直接粘贴
[DEBUG] 策略1执行完成 - 内容已粘贴
[DEBUG] 开始尝试自动发送消息...
[DEBUG] 尝试发送策略1: Enter 键
[DEBUG] 发送策略1执行完成
[DEBUG] Cursor Chat 操作完成，消息已发送
```

## 技术实现

- **命令注册**：在 package.json 的 contributes.commands 中注册
- **核心方法**：`CursorIntegration.openCursorChat(message, autoSend)`
- **支持的打开命令**：
  - `aichat.newchataction`
  - `workbench.action.chat.open`
  - `workbench.action.chat.newChat`
- **输入策略**：
  1. 剪贴板粘贴 (`editor.action.clipboardPasteAction`)
  2. 键盘输入 (`type` 命令)
- **自动发送策略**：
  1. Enter 键发送 (`type` 命令发送 `\n`，等待1.5秒）
  2. Shift + Enter 组合键发送
  3. 提交命令发送 (`workbench.action.chat.submit`, `aichat.submit`, `chat.action.submit`, `workbench.action.chat.send`, `aichat.send`)
  4. 键盘快捷键组合 (`editor.action.submitComment` 等)
  5. 模拟按键序列（连续3次 Enter 键）
  6. 焦点切换后发送 (`workbench.action.focusActiveEditorGroup` + Enter)

## 最新测试结果

**测试时间**: 2024-01-XX
**测试环境**: Cursor
**测试消息**: "reward"
**自动发送**: 启用
**结果**: 成功 - 消息已输入并尝试自动发送到聊天界面
