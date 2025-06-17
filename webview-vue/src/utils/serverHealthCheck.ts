import { sendTaskToVscode } from "./vscodeUtils";

/**
 * 服务器健康检查工具
 */

// 默认服务器配置
const DEFAULT_SERVER_BASE = "http://localhost:3001";

// 服务器端点配置
export const SERVER_ENDPOINTS = {
  health: "/diflow/health", // 健康检查端点 (GET)
  swagger: "/diflow/api", // Swagger 文档端点 (GET)
  login: "/diflow/auth/login", // 登录端点 (POST)
};

// 健康检查结果接口
export interface HealthCheckResult {
  endpoint: string;
  status: "success" | "error";
  statusCode?: number;
  message?: string;
  responseTime?: number;
}

/**
 * 在 webview 环境中通过 VS Code 扩展进行网络请求
 */
async function makeWebviewRequest(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  try {
    // 尝试在 webview 环境中通过 VS Code 扩展发送请求
    const result = await sendTaskToVscode("networkRequest", {
      url,
      method: options.method || "GET",
      headers: options.headers || {},
      body: options.body,
    });

    // 模拟 Response 对象
    return {
      ok: result.ok,
      status: result.status,
      statusText: result.statusText,
      json: () => Promise.resolve(result.data),
      text: () => Promise.resolve(result.text || JSON.stringify(result.data)),
      headers: new Headers(result.headers || {}),
    } as Response;
  } catch (error) {
    console.warn("VS Code 扩展请求失败，尝试直接请求:", error);
    // 如果扩展请求失败，尝试直接请求
    return fetch(url, options);
  }
}

/**
 * 检测是否在 webview 环境中
 */
function isWebviewEnvironment(): boolean {
  return typeof window !== "undefined" && window.vscode !== undefined;
}

/**
 * 发送网络请求（兼容 webview 环境）
 */
async function makeRequest(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  if (isWebviewEnvironment()) {
    try {
      return await makeWebviewRequest(url, options);
    } catch (error) {
      console.warn("Webview 请求失败，尝试直接请求:", error);
    }
  }

  // 直接使用 fetch
  return fetch(url, options);
}

/**
 * 测试单个端点
 */
export async function testEndpoint(
  endpoint: string,
  baseUrl: string = DEFAULT_SERVER_BASE,
): Promise<HealthCheckResult> {
  const url = `${baseUrl}${endpoint}`;
  const startTime = Date.now();

  try {
    console.log(`正在测试端点: ${url}`);

    const response = await makeRequest(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      console.log(`✅ 端点 ${endpoint} 健康检查通过 (${response.status})`);
      return {
        endpoint,
        status: "success",
        statusCode: response.status,
        message: `响应时间: ${responseTime}ms`,
        responseTime,
      };
    } else {
      console.warn(`⚠️ 端点 ${endpoint} 返回错误状态: ${response.status}`);
      return {
        endpoint,
        status: "error",
        statusCode: response.status,
        message: `HTTP ${response.status}: ${response.statusText}`,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ 端点 ${endpoint} 连接失败:`, error);

    return {
      endpoint,
      status: "error",
      message: error instanceof Error ? error.message : "连接失败",
      responseTime,
    };
  }
}

/**
 * 测试所有端点
 */
export async function testAllEndpoints(
  baseUrl: string = DEFAULT_SERVER_BASE,
): Promise<HealthCheckResult[]> {
  console.log(`开始测试所有端点，服务器地址: ${baseUrl}`);

  const endpoints = Object.values(SERVER_ENDPOINTS);
  const results = await Promise.all(
    endpoints.map((endpoint) => testEndpoint(endpoint, baseUrl)),
  );

  // 统计结果
  const successCount = results.filter((r) => r.status === "success").length;
  const totalCount = results.length;

  console.log(`健康检查完成: ${successCount}/${totalCount} 个端点正常`);

  return results;
}

/**
 * 测试服务器健康状态
 */
export async function testServerHealth(
  baseUrl: string = DEFAULT_SERVER_BASE,
): Promise<{
  isHealthy: boolean;
  results: HealthCheckResult[];
  summary: string;
}> {
  console.log("开始服务器健康检查...");

  try {
    const results = await testAllEndpoints(baseUrl);
    const successCount = results.filter((r) => r.status === "success").length;
    const totalCount = results.length;
    const isHealthy = successCount > 0; // 至少有一个端点正常就认为服务器健康

    const summary = `服务器健康状态: ${
      isHealthy ? "健康" : "异常"
    } (${successCount}/${totalCount} 个端点正常)`;

    console.log(summary);

    return {
      isHealthy,
      results,
      summary,
    };
  } catch (error) {
    console.error("服务器健康检查失败:", error);

    return {
      isHealthy: false,
      results: [],
      summary: `健康检查失败: ${
        error instanceof Error ? error.message : "未知错误"
      }`,
    };
  }
}

/**
 * 获取服务器状态摘要
 */
export function getServerStatusSummary(results: HealthCheckResult[]): string {
  if (results.length === 0) {
    return "无可用端点";
  }

  const successCount = results.filter((r) => r.status === "success").length;
  const totalCount = results.length;

  if (successCount === totalCount) {
    return "所有服务正常";
  } else if (successCount > 0) {
    return `部分服务正常 (${successCount}/${totalCount})`;
  } else {
    return "所有服务异常";
  }
}
