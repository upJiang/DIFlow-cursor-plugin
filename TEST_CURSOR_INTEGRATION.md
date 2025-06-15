# DiFlow Cursor 集成功能测试

## 测试环境
- 插件版本: 1.1.1
- 测试时间: 2024年

## 功能测试清单

### ✅ 基础功能测试

#### 1. 环境检测
- [ ] 命令面板 → `DiFlow: 检查 Cursor 环境`
- [ ] 应该显示当前是否在 Cursor 环境中运行

#### 2. Cursor Chat 集成
- [ ] 命令面板 → `DiFlow: 打开 Cursor Chat`
- [ ] 应该尝试打开 Cursor 的 AI 对话界面

#### 3. 代码解释功能
```javascript
// 测试代码：选中下面的函数，然后右键选择 "DiFlow" → "用 Cursor 解释代码"
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

#### 4. 文件审查功能
- [ ] 右键菜单 → `DiFlow` → `用 Cursor 审查文件`
- [ ] 应该将当前文件发送到 Cursor Chat 进行审查

### ✅ Cursor Rules 管理

#### 5. 获取 Cursor Rules
- [ ] 命令面板 → `DiFlow: 获取 Cursor Rules`
- [ ] 如果存在 `.cursorrules` 文件，应该在新标签页中显示内容

#### 6. 设置 Cursor Rules
- [ ] 命令面板 → `DiFlow: 设置 Cursor Rules`
- [ ] 应该弹出输入框，允许设置规则

#### 7. 编辑 Cursor Rules
- [ ] 命令面板 → `DiFlow: 编辑 Cursor Rules`
- [ ] 应该打开或创建 `.cursorrules` 文件进行编辑

### ✅ MCP 配置管理

#### 8. 获取 MCP 设置
- [ ] 命令面板 → `DiFlow: 获取 MCP 设置`
- [ ] 应该显示当前的 MCP 配置（如果存在）

#### 9. 设置 MCP 配置
- [ ] 命令面板 → `DiFlow: 设置 MCP 配置`
- [ ] 应该弹出输入框，允许输入 JSON 格式的 MCP 配置

#### 10. 获取工作区 Cursor 设置
- [ ] 命令面板 → `DiFlow: 获取工作区 Cursor 设置`
- [ ] 应该显示工作区的 Cursor 相关配置

## 测试步骤

1. **打开命令面板**: `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. **输入命令**: 输入 "DiFlow" 查看所有可用命令
3. **测试右键菜单**: 在编辑器中右键，查看 "DiFlow" 子菜单
4. **验证功能**: 逐一测试上述功能清单

## 预期结果

- 所有命令都应该在命令面板中可见
- 右键菜单应该包含 Cursor 相关选项
- 环境检测应该正确识别当前环境
- 文件操作应该正常工作（创建、读取、写入）
- 错误处理应该友好（显示适当的错误消息）

## 注意事项

- 某些功能在非 Cursor 环境中可能有限制
- 文件权限问题可能影响配置文件的读写
- 大文件发送到 Chat 时会有确认提示

## 测试结果记录

请在测试完成后，在对应的功能项前标记：
- ✅ 功能正常
- ❌ 功能异常
- ⚠️ 功能有限制或警告

### 测试环境信息
- 操作系统: macOS
- 编辑器: VS Code / Cursor
- 插件版本: 1.1.1
- 测试日期: ___________ 