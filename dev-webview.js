#!/usr/bin/env node

const { exec, spawn } = require("child_process");
const util = require("util");
const path = require("path");

const execAsync = util.promisify(exec);

const WEBVIEW_PORT = 7979;
const SERVER_PORT = 3001;
const WEBVIEW_NAME = "DIFlow Webview";
const WEBVIEW_DIR = path.join(__dirname, "webview-vue");

// 检查端口是否被占用
async function checkPort(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    return stdout
      .trim()
      .split("\n")
      .filter((pid) => pid);
  } catch (error) {
    // 端口未被占用
    return [];
  }
}

// 杀掉占用端口的进程
async function killProcesses(pids) {
  if (pids.length === 0) return;

  console.log(
    `🔪 发现端口 ${WEBVIEW_PORT} 被占用，正在杀掉进程: ${pids.join(", ")}`
  );

  for (const pid of pids) {
    try {
      await execAsync(`kill -9 ${pid}`);
      console.log(`✅ 已杀掉进程 ${pid}`);
    } catch (error) {
      console.log(`⚠️  无法杀掉进程 ${pid}: ${error.message}`);
    }
  }

  // 等待一秒确保进程完全关闭
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

// 启动webview开发服务器
function startWebview() {
  console.log(`🚀 启动 ${WEBVIEW_NAME} (端口: ${WEBVIEW_PORT})...`);
  console.log(`📁 工作目录: ${WEBVIEW_DIR}`);

  const webviewProcess = spawn("yarn", ["dev"], {
    cwd: WEBVIEW_DIR,
    stdio: "inherit",
    shell: true,
  });

  webviewProcess.on("error", (error) => {
    console.error(`❌ Webview 服务器启动失败: ${error.message}`);
    process.exit(1);
  });

  webviewProcess.on("close", (code) => {
    if (code !== 0) {
      console.log(`⚠️  Webview 进程退出，退出码: ${code}`);
    }
  });

  // 处理进程退出信号
  process.on("SIGINT", () => {
    console.log("\n🛑 正在关闭 Webview 服务器...");
    webviewProcess.kill("SIGINT");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 正在关闭 Webview 服务器...");
    webviewProcess.kill("SIGTERM");
    process.exit(0);
  });

  return webviewProcess;
}

// 检查webview是否可访问
async function checkWebview() {
  const maxRetries = 10;
  const retryDelay = 2000; // 2秒

  for (let i = 0; i < maxRetries; i++) {
    try {
      const { stdout } = await execAsync(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:${WEBVIEW_PORT}`
      );
      const statusCode = stdout.trim();

      if (statusCode === "200") {
        console.log(
          `✅ Webview 开发服务器已可访问: http://localhost:${WEBVIEW_PORT}`
        );
        console.log(`🔗 Server 端口: ${SERVER_PORT}`);
        console.log(`🎉 DIFlow Webview 开发环境就绪!`);
        return true;
      }
    } catch (error) {
      // 继续重试
    }

    if (i < maxRetries - 1) {
      console.log(`⏳ 等待 Webview 服务器启动... (${i + 1}/${maxRetries})`);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }

  console.log(
    `⚠️  Webview 服务器可能无法访问，请手动检查: http://localhost:${WEBVIEW_PORT}`
  );
  return false;
}

// 检查webview-vue目录是否存在
function checkWebviewDirectory() {
  const fs = require("fs");
  if (!fs.existsSync(WEBVIEW_DIR)) {
    console.error(`❌ Webview 目录不存在: ${WEBVIEW_DIR}`);
    process.exit(1);
  }

  const packageJsonPath = path.join(WEBVIEW_DIR, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`❌ Webview package.json 不存在: ${packageJsonPath}`);
    process.exit(1);
  }
}

// 主函数
async function main() {
  console.log(`🔍 检查 Webview 环境...`);

  try {
    // 检查目录
    checkWebviewDirectory();

    // 检查端口占用
    console.log(`🔍 检查端口 ${WEBVIEW_PORT} 占用情况...`);
    const occupiedPids = await checkPort(WEBVIEW_PORT);

    if (occupiedPids.length > 0) {
      await killProcesses(occupiedPids);
    } else {
      console.log(`✅ 端口 ${WEBVIEW_PORT} 未被占用`);
    }

    // 启动webview服务器
    const webviewProcess = startWebview();

    // 等待服务器启动并检查可访问性
    setTimeout(async () => {
      await checkWebview();
    }, 5000); // 等待5秒后检查
  } catch (error) {
    console.error(`❌ 启动失败: ${error.message}`);
    process.exit(1);
  }
}

// 运行主函数
main().catch(console.error);
