# Cursor 规则管理增强功能指南

## 功能概述

DIFlow 插件的 Cursor 规则管理功能已经得到显著增强，现在支持管理三种不同类型的规则：

1. **项目根目录的 `.cursorrules` 文件** - 项目特定规则
2. **项目 `.cursor/rules/` 目录下的 `.mdc` 文件** - Cursor 项目规则文件
3. **Cursor settings.json 中的用户规则** - 全局用户规则

## 🚀 新增功能

### 1. 多规则源支持

- **项目规则文件**：自动读取 `.cursor/rules/` 目录下的所有 `.mdc` 文件
- **元数据解析**：支持解析 `.mdc` 文件的 YAML 前缀元数据
- **Cursor 设置规则**：从 Cursor settings.json 中读取用户规则配置

### 2. 增强的用户界面

- **标签页设计**：不同类型的规则分别显示在不同标签页中
- **规则统计**：提供规则数量统计和优先级说明
- **实时预览**：项目规则文件内容实时显示，支持元数据标签
- **空状态处理**：当没有规则时显示友好的空状态提示

### 3. 智能规则加载

- **并行加载**：同时加载多种规则源，提高加载速度
- **错误处理**：完善的错误处理和用户反馈
- **自动刷新**：组件挂载时自动加载所有规则

## 📋 使用方法

### 1. 打开规则管理界面

1. 在 VS Code 中按 `Ctrl+Shift+P` (Windows/Linux) 或 `Cmd+Shift+P` (macOS)
2. 输入 "Cursor 设置" 或 "DiFlow.getCursorSettings"
3. 选择命令打开 Cursor 管理界面
4. 点击 "规则管理" 标签页

### 2. 查看不同类型的规则

#### .cursorrules 文件标签页

- 显示项目根目录的 `.cursorrules` 文件内容
- 支持直接编辑和保存
- 这些规则只在当前项目中生效

#### 项目规则文件标签页

- 显示 `.cursor/rules/` 目录下的所有 `.mdc` 文件
- 自动解析文件的元数据（description、globs、alwaysApply）
- 以卡片形式展示每个规则文件的内容和路径
- 支持元数据标签显示

#### Cursor 设置规则标签页

- 显示 Cursor settings.json 中配置的用户规则
- 这些规则会在所有项目中全局生效
- 只读显示，需要通过 Cursor 设置界面修改

#### 规则统计标签页

- 显示各类规则的数量统计
- 提供规则优先级说明
- 帮助理解不同规则的作用范围

### 3. 规则管理操作

- **刷新所有规则**：重新加载所有类型的规则
- **保存 .cursorrules**：保存对 `.cursorrules` 文件的修改
- **清空 .cursorrules**：清空 `.cursorrules` 文件内容

## 🔧 技术实现

### 后端增强

#### 新增方法

```typescript
// 获取项目 .cursor/rules/ 目录下的规则文件
async getProjectCursorRules(): Promise<{
  success: boolean;
  rules: Array<{
    name: string;
    path: string;
    content: string;
    metadata?: {
      description?: string;
      globs?: string;
      alwaysApply?: boolean;
    };
  }>;
  error?: string;
}>

// 获取 Cursor settings.json 中的用户规则
async getCursorSettingsUserRule(): Promise<{
  success: boolean;
  userRule?: string;
  error?: string;
}>

// 获取所有规则信息
async getAllRulesInfo(): Promise<{
  success: boolean;
  data: {
    cursorrules: string;
    projectRules: Array<ProjectRule>;
    cursorUserRule: string;
  };
  error?: string;
}>
```

#### YAML 元数据解析

支持解析 `.mdc` 文件的 YAML 前缀：

```yaml
---
description: 通用编码规则
globs: "**/*.ts,**/*.js"
alwaysApply: true
---
规则内容...
```

### 前端增强

#### 新增任务处理器

- `getProjectCursorRules` - 获取项目规则文件
- `getCursorSettingsUserRule` - 获取 Cursor 设置规则
- `getAllRulesInfo` - 获取所有规则信息

#### 组件重构

- 使用 Ant Design Vue 的 Tabs 组件分类显示
- 添加统计组件显示规则数量
- 改进错误处理和用户反馈

## 📁 文件格式示例

### .cursor/rules/common.mdc 示例

```yaml
---
description: 通用编码规则
globs: "**/*.ts,**/*.js,**/*.vue"
alwaysApply: true
---
请不要添加测试代码
node工具使用yarn，不得使用npm
模块清晰，相关内容放到相关目录，不要乱起目录
每一个函数方法都要有对函数的解释，包括入参，出参等

/**
* 函数解释
*/

每次新增功能时不能影响已有功能，除非有特定说明
```

### Cursor settings.json 用户规则示例

```json
{
  "cursor.rules.userRule": "使用 TypeScript 进行开发\n遵循 ESLint 规范\n优先使用函数式编程风格",
  "cursor.userRule": "全局编码约定和最佳实践"
  // 其他 Cursor 设置...
}
```

## 🎯 规则优先级

规则的应用优先级从高到低：

1. **项目规则文件** (.cursor/rules/\*.mdc)

   - 项目特定的规则配置
   - 支持条件应用（globs、alwaysApply）
   - 优先级最高

2. **.cursorrules 文件** (项目根目录)

   - 项目级别的规则
   - 对整个项目生效
   - 中等优先级

3. **Cursor 设置规则** (settings.json)
   - 全局用户规则
   - 在所有项目中生效
   - 优先级最低

## ⚠️ 注意事项

1. **文件权限**：确保对 `.cursor/rules/` 目录和 Cursor 配置文件有读取权限
2. **文件格式**：`.mdc` 文件需要使用正确的 YAML 前缀格式
3. **Cursor 版本**：某些功能可能需要特定版本的 Cursor 支持
4. **规则冲突**：当多个规则源存在冲突时，按优先级应用

## 🔄 更新日志

### v1.3.0 - 规则管理增强

- ✅ 添加项目 `.cursor/rules/` 目录支持
- ✅ 支持 `.mdc` 文件的 YAML 元数据解析
- ✅ 添加 Cursor settings.json 用户规则读取
- ✅ 重构用户界面，使用标签页分类显示
- ✅ 添加规则统计和优先级说明
- ✅ 改进错误处理和用户反馈
- ✅ 支持并行加载多种规则源

## 🚦 测试清单

- [ ] 测试项目规则文件读取（.cursor/rules/\*.mdc）
- [ ] 测试 YAML 元数据解析
- [ ] 测试 Cursor 设置规则读取
- [ ] 测试空状态显示
- [ ] 测试错误处理
- [ ] 测试规则统计显示
- [ ] 测试并行加载性能
- [ ] 测试用户界面响应性

## 📞 技术支持

如果在使用过程中遇到问题：

1. 检查控制台日志获取详细错误信息
2. 确认 Cursor 安装路径和配置文件权限
3. 验证 `.mdc` 文件的 YAML 格式是否正确
4. 查看项目 `.cursor/rules/` 目录结构

---

_此功能为 DIFlow 插件 v1.3.0 新增功能，旨在提供更全面的 Cursor 规则管理体验。_
