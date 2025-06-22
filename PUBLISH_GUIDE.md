# 📦 VS Code 插件发布指南

本项目提供了两个发布脚本，帮助你快速发布 VS Code 插件和服务端代码。

## 🚀 快速发布（推荐）

使用简化版发布脚本，适合日常快速发布：

```bash
# 发布 patch 版本（默认）
yarn release

# 发布不同版本类型
yarn release:patch    # 1.0.0 -> 1.0.1
yarn release:minor    # 1.0.0 -> 1.1.0
yarn release:major    # 1.0.0 -> 2.0.0

# 带自定义提交信息
node publish-simple.js patch "修复分享功能bug"
node publish-simple.js minor "新增MCP管理功能"
```

## 📋 完整发布流程

使用完整版发布脚本，包含更多检查和功能：

```bash
# 发布 patch 版本
yarn publish

# 发布不同版本类型
yarn publish:patch
yarn publish:minor
yarn publish:major

# 查看帮助
yarn publish:help
```

## 🔧 发布流程说明

### 简化版脚本 (`publish-simple.js`) 执行步骤：

1. **更新版本号** - 自动更新主项目和 server 的版本号
2. **构建项目** - 执行 `webpack --mode production`
3. **构建前端** - 执行 `yarn --cwd "webview-vue" build`
4. **构建服务端** - 执行 `cd server && yarn build`
5. **Git 操作** - 提交代码、创建标签、推送到远程
6. **发布插件** - 发布到 VS Code Marketplace（需要 vsce）

### 完整版脚本 (`publish.js`) 额外功能：

- Git 状态检查
- 依赖安装
- 测试运行
- 服务端部署支持
- 详细的日志输出
- 发布后步骤提示

## ⚙️ 准备工作

### 1. 安装 vsce（VS Code Extension CLI）

```bash
npm install -g vsce
```

### 2. 登录 VS Code Marketplace

```bash
vsce login
```

需要提供你的 Azure DevOps Personal Access Token。

### 3. 确保 Git 配置正确

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 📝 版本号规则

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **MAJOR** (主版本号)：不兼容的 API 修改
- **MINOR** (次版本号)：向下兼容的功能性新增
- **PATCH** (修订号)：向下兼容的问题修正

## 🎯 使用示例

### 日常 bug 修复发布：

```bash
yarn release patch "修复MCP配置加载问题"
```

### 新功能发布：

```bash
yarn release minor "新增配置分享功能"
```

### 重大更新发布：

```bash
yarn release major "重构MCP管理架构"
```

## 🚨 注意事项

1. **发布前检查**：

   - 确保所有功能正常工作
   - 运行测试确保没有错误
   - 检查 CHANGELOG.md 是否更新

2. **Git 状态**：

   - 脚本会自动提交未提交的更改
   - 确保不包含不想发布的临时文件

3. **服务端部署**：

   - 设置环境变量 `DEPLOY_SERVER=true` 启用服务端自动部署
   - 需要根据你的部署环境配置具体的部署逻辑

4. **回滚**：
   - 如果发布出现问题，可以删除标签并回滚：
   ```bash
   git tag -d v1.2.3
   git push origin :refs/tags/v1.2.3
   ```

## 🔍 故障排除

### vsce 相关问题：

```bash
# 重新安装 vsce
npm uninstall -g vsce
npm install -g vsce

# 重新登录
vsce logout
vsce login
```

### Git 推送失败：

```bash
# 检查远程仓库配置
git remote -v

# 重新设置远程仓库
git remote set-url origin https://github.com/your-username/your-repo.git
```

### 构建失败：

```bash
# 清理并重新安装依赖
yarn clean
yarn install:all

# 手动构建测试
yarn vscode:prepublish
```

## 📚 相关文档

- [VS Code Extension API](https://code.visualstudio.com/api)
- [vsce 发布工具](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [语义化版本规范](https://semver.org/lang/zh-CN/)

---

如有问题，请查看脚本输出的错误信息或联系开发团队。
