import { sendTaskToVscode } from "./vscodeUtils";

// 基础 URL 配置
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/diflow";

/**
 * 通用网络请求函数，使用 VS Code 扩展代理
 */
const request = async (
  method: string,
  url: string,
  data?: Record<string, unknown> | unknown[],
  headers?: Record<string, string>,
): Promise<{
  status: number;
  data: unknown;
  headers: Record<string, string>;
}> => {
  try {
    console.log("HTTP请求:", method.toUpperCase(), url, data);

    // 构建完整的 URL
    const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;

    // 通过 VS Code 扩展代理请求
    const result = await sendTaskToVscode("proxyRequest", {
      method,
      url: fullUrl,
      data,
      headers,
    });

    console.log("HTTP响应:", result);

    if (result.success) {
      return {
        status: result.status,
        data: result.data,
        headers: result.headers,
      };
    } else {
      throw new Error(result.message || "网络请求失败");
    }
  } catch (error) {
    console.error("响应错误:", error);
    throw error;
  }
};

// API接口定义
export const pluginApi = {
  // 用户认证
  loginOrCreateUser: (
    email: string,
    username?: string,
    cursorUserId?: string,
    avatar?: string,
  ) =>
    request("POST", "/auth/login", {
      email,
      username,
      cursorUserId,
      avatar,
    }),

  // 获取用户信息
  getUserInfo: (userEmail: string, token: string) =>
    request("GET", `/users/${userEmail}`, undefined, {
      Authorization: `Bearer ${token}`,
    }),

  // 获取用户规则
  getUserRules: (userEmail: string, token: string) =>
    request("GET", `/cursor/rules`, undefined, {
      Authorization: `Bearer ${token}`,
    }),

  // 保存用户规则（批量同步）
  saveUserRules: (
    userEmail: string,
    rules: Array<{ ruleName: string; ruleContent: string; sortOrder?: number }>,
    token: string,
  ) =>
    request("POST", `/cursor/sync/rules`, rules, {
      Authorization: `Bearer ${token}`,
    }),

  // 删除用户规则
  deleteUserRules: (userEmail: string, ruleId: number, token: string) =>
    request("DELETE", `/cursor/rules/${ruleId}`, undefined, {
      Authorization: `Bearer ${token}`,
    }),

  // 获取MCP服务器
  getMcpServers: (userEmail: string, token: string) =>
    request("GET", `/cursor/mcps`, undefined, {
      Authorization: `Bearer ${token}`,
    }),

  // 保存MCP服务器（批量同步）
  saveMcpServers: (
    userEmail: string,
    mcps: Array<{
      serverName: string;
      command: string;
      args?: string[];
      env?: Record<string, string>;
      sortOrder?: number;
    }>,
    token: string,
  ) =>
    request("POST", `/cursor/sync/mcps`, mcps, {
      Authorization: `Bearer ${token}`,
    }),

  // 删除MCP服务器
  deleteMcpServers: (userEmail: string, serverId: number, token: string) =>
    request("DELETE", `/cursor/mcps/${serverId}`, undefined, {
      Authorization: `Bearer ${token}`,
    }),
};

// 错误处理函数
export const handleApiError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      success: false,
      message: error.message,
      status: -1,
    };
  }

  // 其他错误
  return {
    success: false,
    message: "未知错误",
    status: -1,
  };
};

export default { pluginApi, handleApiError };
