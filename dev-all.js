#!/usr/bin/env node

const { spawn } = require("child_process");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

// 配置常量
const SERVER_PORT = 3001;
const WEBVIEW_PORT = 7979;
const SERVER_DIR = "./server";
const WEBVIEW_SCRIPT = "./dev-webview.js";

// 存储子进程
const processes = [];

// 检查端口是否被占用
async function isPortOccupied(port) {
  try {
    const { stdout } = await exec(`lsof -ti:${port}`);
    return stdout.trim() !== "";
  } catch (error) {
    return false;
  }
}

// 杀死占用端口的进程
async function killPortProcess(port) {
  try {
    const { stdout } = await exec(`lsof -ti:${port}`);
    if (stdout.trim()) {
      console.log(`🔄 杀死占用端口 ${port} 的进程...`);
      await exec(`kill -9 ${stdout.trim()}`);
      // 等待进程完全终止
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    // 忽略错误，可能端口没有被占用
  }
}

// 启动服务器
async function startServer() {
  console.log("🚀 启动服务器...");

  // 检查并清理端口
  if (await isPortOccupied(SERVER_PORT)) {
    await killPortProcess(SERVER_PORT);
  }

  const serverProcess = spawn("node", ["dev-server.js"], {
    cwd: SERVER_DIR,
    stdio: "inherit",
  });

  processes.push(serverProcess);

  serverProcess.on("error", (error) => {
    console.error("❌ 服务器启动失败:", error);
  });

  return serverProcess;
}

// 启动webview
async function startWebview() {
  console.log("🖥️  启动webview...");

  // 检查并清理端口
  if (await isPortOccupied(WEBVIEW_PORT)) {
    await killPortProcess(WEBVIEW_PORT);
  }

  const webviewProcess = spawn("node", [WEBVIEW_SCRIPT], {
    stdio: "inherit",
  });

  processes.push(webviewProcess);

  webviewProcess.on("error", (error) => {
    console.error("❌ Webview启动失败:", error);
  });

  return webviewProcess;
}

// 检查服务健康状态
async function checkHealth() {
  console.log("🔍 检查服务健康状态...");

  try {
    // 检查服务器健康状态
    const serverHealthCheck = await exec(
      `curl -s -o /dev/null -w "%{http_code}" http://localhost:${SERVER_PORT}/diflow/health`
    );
    const serverStatus = serverHealthCheck.stdout.trim();

    if (serverStatus === "200") {
      console.log("✅ 服务器健康检查通过");
    } else {
      console.log(`⚠️  服务器健康检查失败，状态码: ${serverStatus}`);
    }

    // 检查webview状态
    const webviewHealthCheck = await exec(
      `curl -s -o /dev/null -w "%{http_code}" http://localhost:${WEBVIEW_PORT}`
    );
    const webviewStatus = webviewHealthCheck.stdout.trim();

    if (webviewStatus === "200") {
      console.log("✅ Webview健康检查通过");
    } else {
      console.log(`⚠️  Webview健康检查失败，状态码: ${webviewStatus}`);
    }

    // 检查Swagger文档
    const swaggerCheck = await exec(
      `curl -s -o /dev/null -w "%{http_code}" http://localhost:${SERVER_PORT}/diflow/api`
    );
    const swaggerStatus = swaggerCheck.stdout.trim();

    if (swaggerStatus === "200") {
      console.log("✅ Swagger文档可访问");
      console.log(`📖 Swagger文档: http://localhost:${SERVER_PORT}/diflow/api`);
    } else {
      console.log(`⚠️  Swagger文档访问失败，状态码: ${swaggerStatus}`);
    }

    console.log(`🌐 Webview地址: http://localhost:${WEBVIEW_PORT}`);
  } catch (error) {
    console.error("❌ 健康检查失败:", error.message);
  }
}

// 清理进程
function cleanup() {
  console.log("\n🛑 正在关闭所有服务...");
  processes.forEach((process) => {
    if (process && !process.killed) {
      process.kill("SIGTERM");
    }
  });
  process.exit(0);
}

// 主函数
async function main() {
  console.log("🎯 DIFlow 开发环境启动器");
  console.log("=====================================");

  try {
    // 启动服务器
    await startServer();

    // 等待服务器启动
    console.log("⏳ 等待服务器启动...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 启动webview
    await startWebview();

    // 等待webview启动
    console.log("⏳ 等待webview启动...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 检查健康状态
    await checkHealth();

    console.log("\n🎉 所有服务启动完成！");
    console.log("按 Ctrl+C 停止所有服务");
  } catch (error) {
    console.error("❌ 启动失败:", error);
    cleanup();
  }
}

// 监听退出信号
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

// 启动
main();
