#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  log(`执行命令: ${command}`, colors.cyan);
  try {
    const result = execSync(command, {
      stdio: "inherit",
      encoding: "utf8",
      ...options,
    });
    return result;
  } catch (error) {
    log(`命令执行失败: ${command}`, colors.red);
    log(`错误信息: ${error.message}`, colors.red);
    process.exit(1);
  }
}

function updateVersion(packagePath, versionType = "patch") {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  const currentVersion = packageJson.version;

  // 解析版本号
  const [major, minor, patch] = currentVersion.split(".").map(Number);

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

  log(`版本号已更新: ${currentVersion} -> ${newVersion}`, colors.green);
  return newVersion;
}

function getGitStatus() {
  try {
    const status = execSync("git status --porcelain", {
      encoding: "utf8",
      stdio: "pipe",
    });
    return status.trim();
  } catch (error) {
    return "";
  }
}

function getCurrentBranch() {
  try {
    const branch = execSync("git branch --show-current", {
      encoding: "utf8",
      stdio: "pipe",
    });
    return branch.trim();
  } catch (error) {
    return "main";
  }
}

async function main() {
  try {
    log("🚀 开始一键发布流程...", colors.magenta);

    // 获取命令行参数
    const args = process.argv.slice(2);
    const versionType = args[0] || "patch"; // patch, minor, major
    const commitMessage =
      args[1] || `发布版本 v${new Date().toISOString().split("T")[0]}`;

    // 检查git状态
    log("📋 检查Git状态...", colors.blue);
    const gitStatus = getGitStatus();
    if (gitStatus) {
      log("检测到未提交的更改:", colors.yellow);
      log(gitStatus, colors.yellow);
      log("是否继续发布？将会自动提交这些更改。", colors.yellow);
    }

    const currentBranch = getCurrentBranch();
    log(`当前分支: ${currentBranch}`, colors.blue);

    // 1. 更新主项目版本号
    log("📝 更新主项目版本号...", colors.blue);
    const mainPackagePath = path.join(__dirname, "package.json");
    const mainVersion = updateVersion(mainPackagePath, versionType);

    // 2. 更新server版本号
    log("📝 更新Server版本号...", colors.blue);
    const serverPackagePath = path.join(__dirname, "server", "package.json");
    if (fs.existsSync(serverPackagePath)) {
      updateVersion(serverPackagePath, versionType);
    } else {
      log("Server package.json 不存在，跳过版本更新", colors.yellow);
    }

    // 3. 安装依赖
    log("📦 安装依赖...", colors.blue);
    execCommand("yarn install:all");

    // 4. 构建项目
    log("🔨 构建项目...", colors.blue);
    log("构建VS Code插件...", colors.cyan);
    execCommand("webpack --mode production");

    log("构建webview-vue...", colors.cyan);
    execCommand('yarn --cwd "webview-vue" build');

    // 5. 构建server
    log("🔨 构建Server...", colors.blue);
    if (fs.existsSync(path.join(__dirname, "server"))) {
      execCommand("cd server && yarn build");
    } else {
      log("Server目录不存在，跳过Server构建", colors.yellow);
    }

    // 6. 运行测试（可选）
    if (fs.existsSync(path.join(__dirname, "test"))) {
      log("🧪 运行测试...", colors.blue);
      try {
        execCommand("yarn test");
      } catch (error) {
        log("测试失败，是否继续发布？", colors.yellow);
        // 这里可以添加用户确认逻辑
      }
    }

    // 7. Git提交和推送
    log("📤 提交和推送代码...", colors.blue);

    // 添加所有更改
    execCommand("git add .");

    // 提交更改
    const fullCommitMessage = `${commitMessage} (v${mainVersion})`;
    execCommand(`git commit -m "${fullCommitMessage}"`);

    // 创建标签
    const tagName = `v${mainVersion}`;
    execCommand(`git tag -a ${tagName} -m "Release ${tagName}"`);

    // 推送代码和标签
    execCommand(`git push origin ${currentBranch}`);
    execCommand(`git push origin ${tagName}`);

    // 8. 发布VS Code插件（可选）
    log("📦 准备发布VS Code插件...", colors.blue);
    try {
      // 检查是否安装了vsce
      execCommand("vsce --version", { stdio: "pipe" });

      log("发布到VS Code Marketplace...", colors.cyan);
      execCommand("vsce publish");

      log("✅ VS Code插件发布成功！", colors.green);
    } catch (error) {
      log("⚠️  vsce未安装或发布失败，跳过VS Code插件发布", colors.yellow);
      log("可以手动运行: npm install -g vsce && vsce publish", colors.yellow);
    }

    // 9. 部署server（可选）
    if (process.env.DEPLOY_SERVER === "true") {
      log("🚀 部署Server...", colors.blue);
      // 这里可以添加你的部署逻辑
      // 例如: Docker构建和推送，或者直接部署到服务器
      log("Server部署逻辑需要根据你的具体需求配置", colors.yellow);
    }

    // 完成
    log("🎉 发布完成！", colors.green);
    log(`✅ 版本: v${mainVersion}`, colors.green);
    log(`✅ 分支: ${currentBranch}`, colors.green);
    log(`✅ 标签: ${tagName}`, colors.green);
    log(`✅ 提交信息: ${fullCommitMessage}`, colors.green);

    // 显示后续步骤
    log("\n📋 后续步骤:", colors.blue);
    log("1. 检查VS Code Marketplace发布状态", colors.cyan);
    log("2. 更新CHANGELOG.md", colors.cyan);
    log("3. 通知团队新版本发布", colors.cyan);
  } catch (error) {
    log(`❌ 发布失败: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// 显示帮助信息
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
📦 VS Code插件一键发布脚本

用法:
  node publish.js [版本类型] [提交信息]

参数:
  版本类型: patch (默认) | minor | major
  提交信息: 自定义提交信息 (可选)

示例:
  node publish.js                           # patch版本，默认提交信息
  node publish.js patch "修复bug"           # patch版本，自定义提交信息  
  node publish.js minor "新增功能"          # minor版本
  node publish.js major "重大更新"          # major版本

环境变量:
  DEPLOY_SERVER=true                        # 启用server自动部署

注意事项:
  - 确保已安装vsce: npm install -g vsce
  - 确保已登录vsce: vsce login
  - 确保git工作区干净或已准备好提交更改
  `);
  process.exit(0);
}

// 运行主函数
main().catch((error) => {
  log(`❌ 发布失败: ${error.message}`, colors.red);
  process.exit(1);
});
