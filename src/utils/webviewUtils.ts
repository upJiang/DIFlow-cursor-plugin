import * as vscode from "vscode";
import * as snippet from "../webview/controllers/addSnippets";
import { CursorIntegration } from "../commands/cursorIntegration";

const path = require("path");

// webview key，后期用于区分任务
type WebViewKeys = "main" | "cursor";
// webview 任务的类型
type Tasks =
  | "addSnippets"
  | "route"
  | "getCursorSettings"
  | "updateCursorSettings"
  | "isCursorInstalled"
  | "openCursor"
  | "openCursorChat"
  | "getMcpServers"
  | "addMcpServer"
  | "removeMcpServer"
  | "getUserRules"
  | "updateUserRules"
  | "getSystemInfo"
  | "setCustomInstallPath";

// 当前的webview列表
let webviewPanelList: {
  key: WebViewKeys; // key
  panel: vscode.WebviewPanel; // 视图
  disposables: vscode.Disposable[]; // 管理资源，比如销毁
}[] = [];

// 创建 Cursor 集成实例
const cursorIntegration = new CursorIntegration();

// 创建webview
export const showWebView = (
  context: vscode.ExtensionContext,
  options: {
    key: WebViewKeys; // webview key
    title?: string; // webview 标题
    viewColumn?: vscode.ViewColumn; // one 为左侧，two为右侧
    task?: { task: Tasks; data?: any }; // webview 打开后执行命令，比如转到指定路由
  }
) => {
  // 先判断，webview是否存在了，存在了则不新增，传递消息给webview处理后续
  const webview = webviewPanelList.find((s) => s.key === options.key);

  if (webview) {
    webview.panel.reveal(); // 显示webview
    // 传递任务
    if (options.task) {
      webview.panel.webview.postMessage({
        cmd: "vscodePushTask",
        task: options.task.task,
        data: options.task.data,
      });
    }
  } else {
    const panel = vscode.window.createWebviewPanel(
      "DiFlow",
      options.title || "DiFlow",
      {
        viewColumn: options.viewColumn || vscode.ViewColumn.Two,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
      }
    );
    // 设置icon
    panel.iconPath = vscode.Uri.file(
      path.join(context.extensionPath, "images", "title.jpg")
    );
    panel.webview.html = getHtmlForWebview(context, panel.webview);

    // 创建监听器，监听 webview 返回信息，
    // 在webview中会通过 vscode.postMessage{command: 'someCommand',data: { /* 你的数据 */ },} 发送信息

    // 创建资源管理列表
    const disposables: vscode.Disposable[] = [];
    panel.webview.onDidReceiveMessage(
      async (message: {
        cmd: string;
        cbid: string;
        data: any;
        skipError?: boolean;
      }) => {
        // 监听webview反馈回来加载完成，初始化主动推送消息
        if (message.cmd === "webviewLoaded") {
          if (options.task) {
            panel.webview.postMessage({
              cmd: "vscodePushTask",
              task: options?.task?.task,
              data: options?.task?.data,
            });
          }
        }
        // 分发别的任务
        if (taskMap[message.cmd]) {
          // 将回调消息传递到分发任务中
          taskMap[message.cmd](context, message);
        }
      },
      null,
      disposables
    );
    // 关闭时销毁
    panel.onDidDispose(
      () => {
        panel.dispose();
        while (disposables.length) {
          const x = disposables.pop();
          if (x) {
            x.dispose();
          }
        }
        // 去掉该 panel
        webviewPanelList = webviewPanelList.filter(
          (s) => s.key !== options.key
        );
      },
      null,
      disposables
    );
    // 添加
    webviewPanelList.push({
      key: options.key,
      panel,
      disposables,
    });
  }
};

// 获取 webview html
export const getHtmlForWebview = (
  context: vscode.ExtensionContext,
  webview: vscode.Webview
) => {
  const isProduction =
    context.extensionMode === vscode.ExtensionMode.Production;
  let srcUrl: string | vscode.Uri = "";
  console.log("isProduction", isProduction);

  if (isProduction) {
    console.log("webview-dist/main.mjs");
    const mainScriptPathOnDisk = vscode.Uri.file(
      path.join(context.extensionPath, "webview-dist", "main.mjs")
    );
    srcUrl = webview.asWebviewUri(mainScriptPathOnDisk);
  } else {
    console.log("localhost:7979/src/main.ts");
    srcUrl = "http://localhost:7979/src/main.ts";
  }

  return getWebviewContent(srcUrl);
};

// webview html 容器
const getWebviewContent = (srcUri: string | vscode.Uri) => {
  return `<!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no">
      <title>webview-react</title>
      <script>
         window.vscode = acquireVsCodeApi();
         window.process = {
           env: {
             NODE_ENV: "production",
           },
         }
      </script>
    </head>
    <body>
      <div id="app"></div>
      <script  type="module" src="${srcUri}"></script>
    </body>
    </html>`;
};

// 任务列表，在此处分发任务
const taskMap: Record<string, any> = {
  addSnippets: snippet.addSnippets,
};

// 初始化 Cursor 任务处理器
taskMap.getCursorSettings = async (
  context: vscode.ExtensionContext,
  message: any
) => {
  try {
    console.log("获取 Cursor 设置...");
    const settings = await cursorIntegration.getCursorSettings();
    console.log("Cursor 设置:", settings);

    // 发送结果回 webview - 修复返回格式
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: settings, // 前端期望在 result.data 中获取实际结果
        },
      });
    }
  } catch (error: any) {
    console.error("getCursorSettings task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: error.message,
        },
      });
    }
  }
};

taskMap.updateCursorSettings = async (
  context: vscode.ExtensionContext,
  message: any
) => {
  try {
    console.log("更新 Cursor 设置...", message.data);
    const result = await cursorIntegration.updateCursorSettings(message.data);
    console.log("更新 Cursor 设置结果:", result);

    // 发送结果回 webview - 修复返回格式
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: result, // 前端期望在 result.data 中获取实际结果
        },
      });
    }
  } catch (error: any) {
    console.error("updateCursorSettings task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: error.message,
        },
      });
    }
  }
};

taskMap.openCursorChat = async (
  context: vscode.ExtensionContext,
  message: any
) => {
  try {
    console.log("打开 Cursor 聊天...", message.data);
    const result = await cursorIntegration.openCursorChat(
      message.data?.message
    );
    console.log("打开 Cursor 聊天结果:", result);

    // 发送结果回 webview - 修复返回格式
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: result, // 前端期望在 result.data 中获取实际结果
        },
      });
    }
  } catch (error: any) {
    console.error("openCursorChat task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: error.message,
        },
      });
    }
  }
};

taskMap.getMcpServers = async (
  context: vscode.ExtensionContext,
  message: any
) => {
  try {
    console.log("获取 MCP 服务器列表...");
    const result = await cursorIntegration.getMcpServers();
    console.log("MCP 服务器列表:", result);

    // 发送结果回 webview - 修复返回格式
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: result, // 前端期望在 result.data 中获取实际结果
        },
      });
    }
  } catch (error: any) {
    console.error("getMcpServers task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: error.message,
        },
      });
    }
  }
};

taskMap.addMcpServer = async (
  context: vscode.ExtensionContext,
  message: any
) => {
  try {
    console.log("添加 MCP 服务器...", message.data);
    const { name, config } = message.data;
    const result = await cursorIntegration.addMcpServer(name, config);
    console.log("添加 MCP 服务器结果:", result);

    // 发送结果回 webview - 修复返回格式
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: result, // 前端期望在 result.data 中获取实际结果
        },
      });
    }
  } catch (error: any) {
    console.error("addMcpServer task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: error.message,
        },
      });
    }
  }
};

taskMap.removeMcpServer = async (
  context: vscode.ExtensionContext,
  message: any
) => {
  try {
    console.log("删除 MCP 服务器...", message.data);
    const result = await cursorIntegration.removeMcpServer(message.data.name);
    console.log("删除 MCP 服务器结果:", result);

    // 发送结果回 webview - 修复返回格式
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: result, // 前端期望在 result.data 中获取实际结果
        },
      });
    }
  } catch (error: any) {
    console.error("removeMcpServer task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: error.message,
        },
      });
    }
  }
};

// 添加获取用户规则任务
taskMap.getUserRules = async (
  context: vscode.ExtensionContext,
  message: any
) => {
  try {
    console.log("获取用户规则...");
    const userRules = await cursorIntegration.getUserRules();
    console.log("用户规则:", userRules);

    // 发送结果回 webview - 修复返回格式
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: userRules, // 前端期望在 result.data 中获取实际结果
        },
      });
    }
  } catch (error: any) {
    console.error("getUserRules task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: error.message,
        },
      });
    }
  }
};

// 添加更新用户规则任务
taskMap.updateUserRules = async (
  context: vscode.ExtensionContext,
  message: any
) => {
  try {
    console.log("更新用户规则...", message.data);
    const success = await cursorIntegration.updateUserRules(message.data.rules);
    console.log("更新用户规则结果:", success);

    // 发送结果回 webview - 修复返回格式
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: success, // 前端期望在 result.data 中获取实际结果
        },
      });
    }
  } catch (error: any) {
    console.error("updateUserRules task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: error.message,
        },
      });
    }
  }
};

taskMap.getSystemInfo = async (
  context: vscode.ExtensionContext,
  message: any
) => {
  try {
    console.log("获取系统信息...");
    const systemInfo = cursorIntegration.getSystemInfo();
    console.log("系统信息:", systemInfo);

    // 发送结果回 webview - 修复返回格式
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: systemInfo, // 前端期望在 result.data 中获取实际结果
        },
      });
    }
  } catch (error: any) {
    console.error("getSystemInfo task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: error.message,
        },
      });
    }
  }
};

taskMap.isCursorInstalled = async (
  context: vscode.ExtensionContext,
  message: any
) => {
  try {
    console.log("开始检测 Cursor 安装状态...");
    const result = await cursorIntegration.isCursorInstalled();
    console.log("Cursor 安装检测结果:", result);

    // 发送结果回 webview - 修复返回格式，确保与前端期望一致
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: result, // 前端期望在 result.data 中获取实际结果
        },
      });
    }
  } catch (error) {
    console.error("isCursorInstalled task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
};

taskMap.openCursor = async (context: vscode.ExtensionContext, message: any) => {
  try {
    console.log("打开 Cursor...", message.data);
    const result = await cursorIntegration.openCursor(message.data?.filePath);
    console.log("打开 Cursor 结果:", result);

    // 发送结果回 webview - 修复返回格式
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: result, // 前端期望在 result.data 中获取实际结果
        },
      });
    }
  } catch (error: any) {
    console.error("openCursor task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: error.message,
        },
      });
    }
  }
};

taskMap.setCustomInstallPath = async (
  context: vscode.ExtensionContext,
  message: any
) => {
  try {
    console.log("setCustomInstallPath 收到数据:", message.data);

    // 修复参数名称匹配问题
    const customPath = message.data.path || message.data.customPath;

    if (!customPath) {
      throw new Error("未提供安装路径");
    }

    console.log("设置自定义安装路径:", customPath);
    cursorIntegration.setCustomInstallPath(customPath);

    // 重新检测安装状态
    const isInstalled = await cursorIntegration.isCursorInstalled();
    const systemInfo = cursorIntegration.getSystemInfo();

    console.log("重新检测结果:", { isInstalled, systemInfo });

    // 发送结果回 webview - 修复返回格式
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          isInstalled,
          systemInfo,
        },
      });
    }
  } catch (error) {
    console.error("setCustomInstallPath task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
};
