#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 简单的日志函数
function log(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const prefix =
    {
      info: "📋",
      success: "✅",
      error: "❌",
      warning: "⚠️",
      build: "🔨",
    }[type] || "📋";

  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function exec(command, description) {
  if (description) {
    log(description, "build");
  }

  try {
    execSync(command, { stdio: "inherit" });
    return true;
  } catch (error) {
    log(`命令执行失败: ${command}`, "error");
    return false;
  }
}

function updateVersion(versionType = "patch") {
  const packagePath = path.join(__dirname, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const [major, minor, patch] = packageJson.version.split(".").map(Number);

  let newVersion;
  switch (versionType) {
    case "major":
      newVersion = `${major + 1}.0.0`;
      break;
    case "minor":
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case "patch":
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }

  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");

  // 同时更新server版本
  const serverPackagePath = path.join(__dirname, "server", "package.json");
  if (fs.existsSync(serverPackagePath)) {
    const serverPackageJson = JSON.parse(
      fs.readFileSync(serverPackagePath, "utf8")
    );
    serverPackageJson.version = newVersion;
    fs.writeFileSync(
      serverPackagePath,
      JSON.stringify(serverPackageJson, null, 2) + "\n"
    );
  }

  log(`版本更新: ${packageJson.version} -> ${newVersion}`, "success");
  return newVersion;
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || "patch";
  const commitMsg = args[1] || "发布新版本";

  log("🚀 开始发布流程...");

  // 1. 更新版本号
  const newVersion = updateVersion(versionType);

  // 2. 构建项目 (基于你的 vscode:prepublish 脚本)
  if (!exec("webpack --mode production", "构建 VS Code 插件")) return;
  if (!exec('yarn --cwd "webview-vue" build', "构建 webview-vue")) return;

  // 3. 构建server
  if (fs.existsSync(path.join(__dirname, "server"))) {
    if (!exec("cd server && yarn build", "构建 server")) return;
  }

  // 4. Git 操作
  exec("git add .", "添加所有更改到Git");

  const fullCommitMsg = `${commitMsg} v${newVersion}`;
  if (!exec(`git commit -m "${fullCommitMsg}"`, "提交更改")) {
    log("没有更改需要提交或提交失败", "warning");
  }

  // 创建标签
  exec(`git tag v${newVersion}`, `创建标签 v${newVersion}`);

  // 推送
  const currentBranch = execSync("git branch --show-current", {
    encoding: "utf8",
  }).trim();
  exec(`git push origin ${currentBranch}`, "推送代码");
  exec(`git push origin v${newVersion}`, "推送标签");

  // 5. 发布到 VS Code Marketplace (可选)
  try {
    execSync("vsce --version", { stdio: "pipe" });
    log("发布到 VS Code Marketplace...", "build");
    exec("vsce publish", "发布插件");
    log("插件发布成功!", "success");
  } catch (error) {
    log("vsce 未安装，跳过插件发布", "warning");
    log("手动发布: npm install -g vsce && vsce login && vsce publish", "info");
  }

  log(`🎉 发布完成! 版本: v${newVersion}`, "success");
}

// 帮助信息
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
📦 简化版发布脚本

用法:
  node publish-simple.js [版本类型] [提交信息]

参数:
  版本类型: patch (默认) | minor | major
  提交信息: 自定义提交信息

示例:
  node publish-simple.js                    # patch版本
  node publish-simple.js minor "新功能"     # minor版本
  node publish-simple.js major "重大更新"   # major版本

注意: 需要先安装 vsce 才能发布到 Marketplace
  npm install -g vsce
  vsce login
`);
  process.exit(0);
}

main();
