import * as vscode from "vscode";
import * as snippet from "../webview/controllers/addSnippets";
import { CursorIntegration } from "../commands/cursorIntegration";

const path = require("path");
const fs = require("fs");

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
  | "setCustomInstallPath"
  | "getCursorUserInfo"
  | "isCursorLoggedIn"
  | "loginOrCreateUser"
  | "syncUserData"
  | "syncRulesToServer"
  | "syncMcpsToServer"
  | "networkRequest"
  | "proxyRequest"
  | "getMcpConfigJson"
  | "batchUpdateMcpConfig"
  | "shareMcpConfig"
  | "getMcpConfigByShareId"
  | "addMcpByShareId";

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
    task?: { task: Tasks; data?: unknown }; // webview 打开后执行命令，比如转到指定路由
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
        data: unknown;
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

    // 如果有任务，执行任务
    if (options.task) {
      setTimeout(() => {
        panel.webview.postMessage({
          cmd: "vscodePushTask",
          task: options.task!.task,
          data: options.task!.data,
        });
      }, 500);
    }
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
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' vscode-webview: http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*; style-src 'unsafe-inline' vscode-webview: http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*; connect-src vscode-webview: http://localhost:* https://localhost:* ws://localhost:* wss://localhost:* http://127.0.0.1:* https://127.0.0.1:* ws://127.0.0.1:* wss://127.0.0.1:*; img-src vscode-webview: data: http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*; font-src vscode-webview: http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:*;">
      <title>webview-react</title>
      <script>
         window.vscode = acquireVsCodeApi();
         window.process = {
           env: {
             NODE_ENV: "production",
           },
         }
         // 添加调试信息
         console.log("Webview CSP configured for localhost and 127.0.0.1");
      </script>
    </head>
    <body>
      <div id="app"></div>
      <script  type="module" src="${srcUri}"></script>
    </body>
    </html>`;
};

/**
 * 任务消息接口
 */
interface TaskMessage {
  cbid?: string;
  data?: unknown;
}

/**
 * 类型安全的数据访问辅助函数
 */
function getTaskData(data: unknown): Record<string, unknown> {
  return data && typeof data === "object" && data !== null
    ? (data as Record<string, unknown>)
    : {};
}

/**
 * 任务处理器接口
 */
interface TaskHandler {
  (context: vscode.ExtensionContext, message: TaskMessage): Promise<void>;
}

/**
 * 具体任务数据类型定义
 */
interface AddMcpServerData {
  name: string;
  config: {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    [key: string]: unknown;
  };
}

interface RemoveMcpServerData {
  name: string;
}

interface OpenCursorData {
  filePath?: string;
}

interface SetCustomInstallPathData {
  path?: string;
  customPath?: string;
}

interface NetworkRequestData {
  url: string;
  method?: string;
  headers?: Record<string, unknown>;
  body?: unknown;
}

interface ProxyRequestData {
  method: string;
  url: string;
  data?: unknown;
  headers?: Record<string, unknown>;
}

interface OpenCursorChatData {
  message?: string;
}

/**
 * 任务映射表
 */
const taskMap: Record<string, TaskHandler> = {};

// 添加更新用户规则任务
taskMap.updateUserRules = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("更新用户规则...", message.data);
    const data = message.data as { rules?: string };
    const rules = data?.rules;
    if (typeof rules !== "string") {
      throw new Error("规则内容必须是字符串类型");
    }
    const result = await cursorIntegration.updateUserRules(rules);
    console.log("更新用户规则结果:", result);

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
  } catch (error: unknown) {
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
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
};

// 添加获取 Cursor 设置任务
taskMap.getCursorSettings = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
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
  } catch (error: unknown) {
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
          error: error instanceof Error ? error.message : String(error),
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

// 添加 snippet 任务处理器
taskMap.addSnippets = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    // 确保 message.data 包含必要的字段
    const data = message.data;
    if (!data || typeof data !== "object") {
      throw new Error("缺少必要的数据");
    }

    // 类型断言确保数据结构正确
    const snippetData = data as {
      tips: string;
      prefix: string;
      body: string;
      description: string;
    };

    if (
      !snippetData.tips ||
      !snippetData.prefix ||
      !snippetData.body ||
      !snippetData.description
    ) {
      throw new Error("缺少必要的代码片段字段");
    }

    await snippet.addSnippets(context, { data: snippetData });
  } catch (error: unknown) {
    console.error("addSnippets task failed:", error);
  }
};

taskMap.openCursorChat = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("打开 Cursor 聊天...", message.data);
    const data = message.data as OpenCursorChatData;
    const result = await cursorIntegration.openCursorChat(data?.message || "");
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
  } catch (error: unknown) {
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
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
};

// 添加发送消息到Cursor Chat的任务处理器
taskMap.sendToCursorChat = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("发送消息到 Cursor Chat...", message.data);
    const data = message.data as OpenCursorChatData;
    const result = await cursorIntegration.openCursorChat(data?.message || "");
    console.log("发送消息到 Cursor Chat 结果:", result);

    // 发送结果回 webview - 修复返回格式
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: result,
          data: result,
        },
      });
    }
  } catch (error: unknown) {
    console.error("sendToCursorChat task failed:", error);
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

taskMap.getMcpServers = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
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
  } catch (error: unknown) {
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
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
};

taskMap.addMcpServer = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("添加 MCP 服务器...", message.data);
    const data = message.data as AddMcpServerData;
    const { name, config } = data;
    if (!name || !config) {
      throw new Error("缺少必要参数：name 或 config");
    }

    // 确保 config 包含必要的 command 字段
    const mcpConfig = config as {
      command: string;
      args?: string[];
      env?: Record<string, string>;
      [key: string]: unknown;
    };
    if (!mcpConfig.command) {
      throw new Error("MCP 配置缺少必要的 command 字段");
    }

    const result = await cursorIntegration.addMcpServer(name, mcpConfig);
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
  } catch (error: unknown) {
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
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
};

taskMap.removeMcpServer = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("删除 MCP 服务器...", message.data);
    const data = message.data as RemoveMcpServerData;
    const { name } = data;
    if (!name) {
      throw new Error("缺少必要参数：name");
    }
    const result = await cursorIntegration.removeMcpServer(name);
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
  } catch (error: unknown) {
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
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
};

// 添加获取用户规则任务
taskMap.getUserRules = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
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
  } catch (error: unknown) {
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
          error: error instanceof Error ? error.message : String(error),
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

taskMap.openCursor = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("打开 Cursor...", message.data);
    const data = message.data as OpenCursorData;
    const filePath = data?.filePath;
    const result = await cursorIntegration.openCursor(filePath);
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
  } catch (error: unknown) {
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
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
};

taskMap.setCustomInstallPath = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("setCustomInstallPath 收到数据:", message.data);

    // 修复参数名称匹配问题
    const data = message.data as SetCustomInstallPathData;
    const customPath = data?.path || data?.customPath;

    if (!customPath || typeof customPath !== "string") {
      throw new Error("未提供有效的安装路径");
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
  } catch (error: unknown) {
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

// 获取 Cursor 用户信息任务处理器
taskMap.getCursorUserInfo = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("获取 Cursor 用户信息...");
    const userInfo = await cursorIntegration.getCursorUserInfo();
    console.log("Cursor 用户信息:", userInfo);

    // 发送结果回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: userInfo,
        },
      });
    }
  } catch (error: unknown) {
    console.error("getCursorUserInfo task failed:", error);
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

// 检查 Cursor 登录状态任务处理器
taskMap.isCursorLoggedIn = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("检查 Cursor 登录状态...");
    const isLoggedIn = await cursorIntegration.isCursorLoggedIn();
    console.log("Cursor 登录状态:", isLoggedIn);

    // 发送结果回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: isLoggedIn,
        },
      });
    }
  } catch (error: unknown) {
    console.error("isCursorLoggedIn task failed:", error);
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

// 登录或创建用户任务处理器
taskMap.loginOrCreateUser = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("获取Cursor用户信息...", message.data);

    // 获取Cursor用户信息
    const cursorUserInfo = await cursorIntegration.getCursorUserInfo();
    console.log("Cursor用户信息:", cursorUserInfo);

    // 发送用户信息到webview，让webview处理API调用
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: cursorUserInfo,
        },
      });
    }
  } catch (error: any) {
    console.error("loginOrCreateUser task failed:", error);

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

// 同步用户数据任务处理器 - 简化为只返回成功状态
taskMap.syncUserData = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("同步用户数据任务 - 由webview处理", message.data);

    // 发送结果回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          message: "任务已转发到webview处理",
        },
      });
    }
  } catch (error: unknown) {
    console.error("syncUserData task failed:", error);

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

// 同步规则到服务器任务处理器 - 简化为只返回成功状态
taskMap.syncRulesToServer = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("同步规则到服务器任务 - 由webview处理", message.data);

    // 发送结果回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          message: "任务已转发到webview处理",
        },
      });
    }
  } catch (error: unknown) {
    console.error("syncRulesToServer task failed:", error);

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

// 同步 MCP 配置到服务器任务处理器 - 简化为只返回成功状态
taskMap.syncMcpsToServer = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("同步MCP配置到服务器任务 - 由webview处理", message.data);

    // 发送结果回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          message: "任务已转发到webview处理",
        },
      });
    }
  } catch (error: unknown) {
    console.error("syncMcpsToServer task failed:", error);

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

// 网络请求处理器 - 允许 webview 通过扩展进行网络请求
taskMap.networkRequest = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    const requestData = message.data as NetworkRequestData;
    if (!requestData || typeof requestData !== "object") {
      throw new Error("请求数据无效");
    }

    const { url, method = "GET", headers = {}, body } = requestData;
    if (!url || typeof url !== "string") {
      throw new Error("URL 参数无效");
    }

    console.log(`网络请求: ${method} ${url}`);

    // 使用 Node.js 的 https/http 模块进行请求
    const https = require("https");
    const http = require("http");
    const { URL } = require("url");

    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === "https:";
    const requestModule = isHttps ? https : http;

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        "User-Agent": "DIFlow-VSCode-Extension/1.0.0",
        ...(typeof headers === "object" && headers !== null ? headers : {}),
      },
    };

    interface NetworkResponse {
      ok: boolean;
      status: number;
      statusText: string;
      data: unknown;
      text: string;
      headers: Record<string, string>;
    }

    const result = await new Promise<NetworkResponse>((resolve, reject) => {
      const req = requestModule.request(requestOptions, (res: any) => {
        let data = "";
        res.on("data", (chunk: any) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            let parsedData: unknown;
            try {
              parsedData = JSON.parse(data);
            } catch {
              parsedData = data;
            }

            resolve({
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              statusText: res.statusMessage,
              data: parsedData,
              text: data,
              headers: res.headers,
            });
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on("error", (error: Error) => {
        reject(error);
      });

      if (
        body &&
        (method === "POST" || method === "PUT" || method === "PATCH")
      ) {
        req.write(typeof body === "string" ? body : JSON.stringify(body));
      }

      req.end();
    });

    console.log(`网络请求完成: ${method} ${url} - ${result.status}`);

    // 发送结果回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: result,
        },
      });
    }
  } catch (error: unknown) {
    console.error("网络请求失败:", error);

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

// 网络请求代理任务
taskMap.proxyRequest = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("代理网络请求:", message.data);
    const requestData = message.data as ProxyRequestData;
    if (!requestData || typeof requestData !== "object") {
      throw new Error("请求数据无效");
    }

    const { method, url, data, headers } = requestData;
    if (!method || !url) {
      throw new Error("方法或URL参数缺失");
    }

    // 使用 Node.js 的 https/http 模块发送请求
    const https = require("https");
    const http = require("http");
    const urlLib = require("url");

    const parsedUrl = urlLib.parse(url);
    const isHttps = parsedUrl.protocol === "https:";
    const requestLib = isHttps ? https : http;

    // 构建请求选项
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: String(method).toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "DIFlow-VSCode-Extension/1.0.0",
        ...(headers || {}),
      },
      // 忽略 SSL 证书验证（仅用于开发）
      rejectUnauthorized: false,
    };

    console.log("代理请求选项:", options);

    interface ProxyResponse {
      success: boolean;
      status?: number;
      data?: unknown;
      headers?: Record<string, string>;
      message?: string;
      error?: Error;
    }

    // 发送请求
    const result = await new Promise<ProxyResponse>((resolve, reject) => {
      const req = requestLib.request(options, (res: any) => {
        let responseData = "";

        res.on("data", (chunk: any) => {
          responseData += chunk;
        });

        res.on("end", () => {
          try {
            console.log("原始响应数据:", responseData);
            const parsedData = responseData ? JSON.parse(responseData) : {};
            resolve({
              success: true,
              status: res.statusCode,
              data: parsedData,
              headers: res.headers,
            });
          } catch (parseError) {
            console.log("JSON解析失败，返回原始数据:", parseError);
            resolve({
              success: true,
              status: res.statusCode,
              data: responseData,
              headers: res.headers,
            });
          }
        });
      });

      req.on("error", (error: Error) => {
        console.error("代理请求错误:", error);
        reject({
          success: false,
          message: `网络请求失败: ${error.message}`,
          error: error,
        });
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject({
          success: false,
          message: "请求超时",
          error: new Error("Request timeout"),
        });
      });

      // 发送请求体数据
      if (
        data &&
        (String(method).toUpperCase() === "POST" ||
          String(method).toUpperCase() === "PUT")
      ) {
        const jsonData = JSON.stringify(data);
        console.log("发送请求体数据:", jsonData);
        req.write(jsonData);
      }

      req.end();
    });

    console.log("代理请求成功:", result);

    // 发送结果回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: result,
      });
    }
  } catch (error: unknown) {
    console.error("proxyRequest task failed:", error);
    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          message: error instanceof Error ? error.message : "网络请求失败",
          error: error,
        },
      });
    }
  }
};

// MCP 配置 JSON 管理
taskMap["cursor:getMcpConfigJson"] = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("=== 开始获取 MCP 配置 JSON ===");
    console.log("消息数据:", message);

    // 直接获取本地配置，API调用由前端通过httpUtils处理
    console.log("调用 cursorIntegration.getMcpConfigJson()...");
    const result = await cursorIntegration.getMcpConfigJson();
    console.log("获取 MCP 配置 JSON 结果:", result);
    console.log("配置项数量:", Object.keys(result.mcpConfig || {}).length);

    // 发送结果回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    console.log("找到的 webview panels:", panels.length);

    if (panels.length > 0 && message.cbid) {
      console.log("发送成功响应到 webview, cbid:", message.cbid);
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: result,
        },
      });
      console.log("✅ 成功发送响应到 webview");
    } else {
      console.error("❌ 没有找到对应的 webview panel 或缺少 cbid");
      console.log("panels.length:", panels.length);
      console.log("message.cbid:", message.cbid);
    }
  } catch (error: unknown) {
    console.error("❌ getMcpConfigJson task failed:", error);

    // 发送错误回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      console.log("发送错误响应到 webview, cbid:", message.cbid);
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

taskMap["cursor:batchUpdateMcpConfig"] = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("批量更新 MCP 配置...", message.data);
    const data = message.data as { mcpConfig: Record<string, any> };

    // 更新本地配置
    const result = await cursorIntegration.batchUpdateMcpConfig(data.mcpConfig);
    console.log("批量更新 MCP 配置结果:", result);

    // 发送结果回 webview
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: true,
          data: result,
        },
      });
    }
  } catch (error: unknown) {
    console.error("batchUpdateMcpConfig task failed:", error);
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

taskMap["cursor:shareMcpConfig"] = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("分享 MCP 配置...", message.data);

    // 这个任务应该由前端通过httpUtils调用后端API
    // 这里只是一个占位符，实际的API调用在前端进行

    // 发送结果回 webview，告诉前端需要调用API
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: "此功能需要通过前端httpUtils调用后端API",
        },
      });
    }
  } catch (error: unknown) {
    console.error("shareMcpConfig task failed:", error);
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

taskMap["cursor:getMcpConfigByShareId"] = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("获取分享配置...", message.data);

    // 这个任务应该由前端通过httpUtils调用后端API
    // 这里只是一个占位符，实际的API调用在前端进行

    // 发送结果回 webview，告诉前端需要调用API
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: "此功能需要通过前端httpUtils调用后端API",
        },
      });
    }
  } catch (error: unknown) {
    console.error("getMcpConfigByShareId task failed:", error);
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

taskMap["cursor:addMcpByShareId"] = async (
  context: vscode.ExtensionContext,
  message: TaskMessage
) => {
  try {
    console.log("通过分享 ID 添加配置...", message.data);

    // 这个任务应该由前端通过httpUtils调用后端API
    // 这里只是一个占位符，实际的API调用在前端进行

    // 发送结果回 webview，告诉前端需要调用API
    const panels = webviewPanelList.filter(
      (panel) => panel.key === "cursor" || panel.key === "main"
    );
    if (panels.length > 0 && message.cbid) {
      panels[0].panel.webview.postMessage({
        cbid: message.cbid,
        data: {
          success: false,
          error: "此功能需要通过前端httpUtils调用后端API",
        },
      });
    }
  } catch (error: unknown) {
    console.error("addMcpByShareId task failed:", error);
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

// 辅助函数：获取存储的token
async function getStoredToken(): Promise<string> {
  // 这里需要从VS Code的存储中获取token
  // 暂时返回空字符串，实际应该从context.globalState或其他地方获取
  return "";
}
