import axios from "axios";

import { handleApiError } from "./httpUtils";

export interface ServerTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  status?: number;
  data?: unknown;
}

export interface ServerConfig {
  baseURL: string;
  timeout: number;
}

// 默认服务器配置
export const DEFAULT_SERVER_CONFIG: ServerConfig = {
  baseURL: "http://localhost:3001",
  timeout: 10000,
};

// 测试服务器连接
export const testServerConnection = async (
  config: ServerConfig = DEFAULT_SERVER_CONFIG,
): Promise<ServerTestResult> => {
  const startTime = Date.now();

  try {
    const response = await axios.get(`${config.baseURL}/diflow/health`, {
      timeout: config.timeout,
    });

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      message: "服务器连接成功",
      responseTime,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorResult = handleApiError(error);

    return {
      success: false,
      message: errorResult.message,
      responseTime,
      status: errorResult.status,
    };
  }
};

// 测试API端点
export const testApiEndpoint = async (
  endpoint: string,
  method: "GET" | "POST" = "GET",
  data?: unknown,
  config: ServerConfig = DEFAULT_SERVER_CONFIG,
): Promise<ServerTestResult> => {
  const startTime = Date.now();

  try {
    const axiosConfig = {
      timeout: config.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    };

    let response;
    // 健康检查端点使用特殊路径
    const fullUrl =
      endpoint === "/health"
        ? `${config.baseURL}/diflow/health`
        : `${config.baseURL}/diflow/api${endpoint}`;

    if (method === "GET") {
      response = await axios.get(fullUrl, axiosConfig);
    } else {
      response = await axios.post(fullUrl, data, axiosConfig);
    }

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      message: `API端点 ${endpoint} 测试成功`,
      responseTime,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorResult = handleApiError(error);

    return {
      success: false,
      message: `API端点 ${endpoint} 测试失败: ${errorResult.message}`,
      responseTime,
      status: errorResult.status,
    };
  }
};

// 批量测试API端点
export const testMultipleEndpoints = async (
  endpoints: Array<{ path: string; method?: "GET" | "POST"; data?: unknown }>,
  config: ServerConfig = DEFAULT_SERVER_CONFIG,
): Promise<Array<ServerTestResult & { endpoint: string }>> => {
  const results = await Promise.allSettled(
    endpoints.map(async (endpoint) => {
      const result = await testApiEndpoint(
        endpoint.path,
        endpoint.method,
        endpoint.data,
        config,
      );
      return { ...result, endpoint: endpoint.path };
    }),
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        success: false,
        message: `测试失败: ${result.reason}`,
        endpoint: endpoints[index].path,
      };
    }
  });
};

// 获取服务器信息
export const getServerInfo = (
  config: ServerConfig = DEFAULT_SERVER_CONFIG,
): Promise<ServerTestResult> => {
  return testApiEndpoint("/info", "GET", undefined, config);
};

// 检查服务器健康状态
export const checkServerHealth = (
  config: ServerConfig = DEFAULT_SERVER_CONFIG,
): Promise<ServerTestResult> => {
  return testApiEndpoint("/health", "GET", undefined, config);
};
