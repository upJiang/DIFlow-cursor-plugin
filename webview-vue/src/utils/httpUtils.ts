import { getCookie } from "./cookie";
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

    // 自动获取token并添加到请求头
    const mergedHeaders = { ...headers };
    if (!mergedHeaders.Authorization) {
      console.log("🔍 Token获取调试信息:");

      let authToken: string | null = null;

      // 从localStorage获取token
      const cloudToken = localStorage.getItem("diflow_cloud_token");
      console.log(
        "  - cloudToken from localStorage:",
        cloudToken ? `${cloudToken.substring(0, 20)}...` : "null",
      );
      authToken = cloudToken;

      if (authToken) {
        mergedHeaders.Authorization = `Bearer ${authToken}`;
        console.log("  - 使用token设置Authorization头");
      } else {
        // 如果没有云端token，尝试从cookie获取
        const cookieToken = getCookie("access_token");
        console.log("  - cookieToken:", cookieToken);
        if (cookieToken) {
          mergedHeaders.Authorization = `Bearer ${cookieToken}`;
          console.log("  - 使用cookie token设置Authorization头");
        } else {
          console.log("  - ⚠️ 未找到任何可用的token");
        }
      }
    } else {
      console.log(
        "  - 请求头中已存在Authorization:",
        mergedHeaders.Authorization,
      );
    }

    console.log("🔍 最终请求头:", mergedHeaders);

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
      // VS Code扩展返回的result结构: {success: true, status: 200, data: serverResponse, headers: {}}
      if (result && typeof result === "object") {
        console.log("🔍 代理响应结构分析:");
        console.log("  - result类型:", typeof result);
        console.log(
          "  - result.success:",
          "success" in result ? result.success : "不存在",
        );
        console.log(
          "  - result.status:",
          "status" in result ? result.status : "不存在",
        );
        console.log(
          "  - result.statusCode:",
          "statusCode" in result ? result.statusCode : "不存在",
        );
        console.log(
          "  - result.data:",
          "data" in result ? result.data : "不存在",
        );
        console.log(
          "  - result.headers:",
          "headers" in result ? result.headers : "不存在",
        );
        console.log("  - result本身是否有code字段:", "code" in result);
        console.log("  - result本身是否有msg字段:", "msg" in result);

        // 检查是否是错误响应格式 {statusCode: 500, message: 'error'}
        if ("statusCode" in result && typeof result.statusCode === "number") {
          if (result.statusCode >= 400) {
            // HTTP错误状态码
            const errorMsg =
              "message" in result
                ? result.message
                : `HTTP ${result.statusCode} 错误`;
            console.log("🔍 检测到HTTP错误:", result.statusCode, errorMsg);
            throw new Error(errorMsg);
          }
        }

        // 检查是否是直接的服务器响应格式 {code, msg, data}
        if ("code" in result && "msg" in result && !("success" in result)) {
          console.log("🔍 检测到直接的服务器响应:", result);

          if (result.code === 0 || result.code === 200) {
            // 服务器返回成功
            return {
              status: 200,
              data: result.data,
              headers: {},
            };
          } else {
            // 服务器返回业务错误
            throw new Error(result.msg || `服务端错误: ${result.code}`);
          }
        }

        // 检查代理请求本身是否成功
        if ("success" in result && !result.success) {
          // 代理请求失败
          const errorMsg =
            "message" in result ? result.message : "代理请求失败";
          throw new Error(errorMsg);
        }

        // 获取服务器的实际响应数据
        const serverResponse = result.data;

        // 检查服务器响应是否是标准格式 {code, msg, data}
        if (
          serverResponse &&
          typeof serverResponse === "object" &&
          "code" in serverResponse &&
          "msg" in serverResponse
        ) {
          console.log("🔍 服务器响应数据:", serverResponse);

          if (serverResponse.code === 0 || serverResponse.code === 200) {
            // 服务器返回成功
            return {
              status: result.status || 200,
              data: serverResponse.data, // 返回服务器数据中的 data 字段
              headers: result.headers || {},
            };
          } else {
            // 服务器返回业务错误
            throw new Error(
              serverResponse.msg || `服务端错误: ${serverResponse.code}`,
            );
          }
        } else {
          // 非标准格式，直接返回服务器响应
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      // 处理标准服务端响应格式
      if (
        responseData &&
        typeof responseData === "object" &&
        "code" in responseData
      ) {
        if (responseData.code === 0 || responseData.code === 200) {
          return {
            status: response.status,
            data: responseData.data,
            headers: {},
          };
        } else {
          throw new Error(
            responseData.msg || `服务端错误: ${responseData.code}`,
          );
        }
      }

      return {
        status: response.status,
        data: responseData,
        headers: {},
      };
    }
  } catch (error) {
    console.error("请求错误:", error);
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
