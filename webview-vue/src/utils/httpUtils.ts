import { sendTaskToVscode } from "./vscodeUtils";

// 基础 URL 配置
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/diflow";

/**
 * 检测是否在 webview 环境中
 */
function isWebviewEnvironment(): boolean {
  return typeof window !== "undefined" && window.vscode !== undefined;
}

/**
 * 通用网络请求函数
 * 自动处理token认证，无需手动传入token参数
 */
export const httpRequest = async (
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

    // 简化的请求头处理
    const mergedHeaders = { ...headers };

    // 在webview环境中使用VS Code扩展代理
    if (isWebviewEnvironment()) {
      console.log("使用VS Code扩展代理发送请求");

      const result = await sendTaskToVscode("proxyRequest", {
        method,
        url: fullUrl,
        data,
        headers: mergedHeaders,
      });

      console.log("代理请求响应:", result);

      // 处理代理响应
      if (result && typeof result === "object") {
        // 检查是否是错误响应格式
        if ("statusCode" in result && typeof result.statusCode === "number") {
          if (result.statusCode >= 400) {
            const errorMsg =
              "message" in result
                ? result.message
                : `HTTP ${result.statusCode} 错误`;
            console.log("检测到HTTP错误:", result.statusCode, errorMsg);
            throw new Error(errorMsg);
          }
        }

        // 检查是否是直接的服务器响应格式
        if ("code" in result && "msg" in result && !("success" in result)) {
          if (result.code === 0 || result.code === 200) {
            return {
              status: 200,
              data: result.data,
              headers: {},
            };
          } else {
            throw new Error(result.msg || `服务端错误: ${result.code}`);
          }
        }

        // 获取服务器的实际响应数据
        const serverResponse = result.data;

        // 检查服务器响应是否是标准格式
        if (
          serverResponse &&
          typeof serverResponse === "object" &&
          "code" in serverResponse &&
          "msg" in serverResponse
        ) {
          if (serverResponse.code === 0 || serverResponse.code === 200) {
            return {
              status: result.status || 200,
              data: serverResponse.data,
              headers: result.headers || {},
            };
          } else {
            throw new Error(
              serverResponse.msg || `服务端错误: ${serverResponse.code}`,
            );
          }
        } else {
          return {
            status: result.status || result.statusCode || 200,
            data: serverResponse,
            headers: result.headers || {},
          };
        }
      } else {
        throw new Error("代理请求失败");
      }
    } else {
      // 在普通浏览器环境中使用fetch
      console.log("使用fetch发送请求");

      const response = await fetch(fullUrl, {
        method: method.toUpperCase(),
        headers: {
          "Content-Type": "application/json",
          ...mergedHeaders,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await response.json();

      return {
        status: response.status,
        data: responseData,
        headers: {},
      };
    }
  } catch (error) {
    console.error("HTTP请求错误:", error);
    throw error;
  }
};

/**
 * 错误处理函数
 */
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
