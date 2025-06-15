import axios, { AxiosInstance, AxiosResponse } from "axios";

// 获取API基础URL，优先使用环境变量，否则使用默认值
const getApiBaseUrl = () => {
  return (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:6666/diflow/api"
  );
};

// 创建axios实例
const httpClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
httpClient.interceptors.request.use(
  (config) => {
    console.log(
      "HTTP请求:",
      config.method?.toUpperCase(),
      config.url,
      config.data,
    );
    return config;
  },
  (error) => {
    console.error("HTTP请求错误:", error);
    return Promise.reject(error);
  },
);

// 响应拦截器
httpClient.interceptors.response.use(
  (response) => {
    console.log("HTTP响应:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error(
      "HTTP响应错误:",
      error.response?.status,
      error.response?.data,
    );
    return Promise.reject(error);
  },
);

// API接口定义
export const pluginApi = {
  // 用户认证
  auth: (userEmail: string): Promise<AxiosResponse<any>> => {
    return httpClient.post("/auth", { userEmail });
  },

  // 获取用户信息
  getUserInfo: (
    userEmail: string,
    token: string,
  ): Promise<AxiosResponse<any>> => {
    return httpClient.get(`/user/${userEmail}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // 获取用户规则
  getUserRules: (
    userEmail: string,
    token: string,
  ): Promise<AxiosResponse<any>> => {
    return httpClient.get(`/user/${userEmail}/rules`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // 保存用户规则
  saveUserRules: (
    userEmail: string,
    rules: any,
    token: string,
  ): Promise<AxiosResponse<any>> => {
    return httpClient.put(
      `/user/${userEmail}/rules`,
      { rules },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },

  // 删除用户规则
  deleteUserRules: (
    userEmail: string,
    token: string,
  ): Promise<AxiosResponse<any>> => {
    return httpClient.delete(`/user/${userEmail}/rules`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // 获取MCP服务器配置
  getMcpServers: (
    userEmail: string,
    token: string,
  ): Promise<AxiosResponse<any>> => {
    return httpClient.get(`/user/${userEmail}/mcps`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // 保存MCP服务器配置
  saveMcpServers: (
    userEmail: string,
    mcps: any,
    token: string,
  ): Promise<AxiosResponse<any>> => {
    return httpClient.put(
      `/user/${userEmail}/mcps`,
      { mcps },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  },

  // 删除MCP服务器配置
  deleteMcpServers: (
    userEmail: string,
    token: string,
  ): Promise<AxiosResponse<any>> => {
    return httpClient.delete(`/user/${userEmail}/mcps`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

// 错误处理函数
export const handleApiError = (error: any) => {
  if (error.response) {
    // 服务器响应错误
    return {
      success: false,
      error: error.response.data?.message || "服务器错误",
      status: error.response.status,
    };
  } else if (error.request) {
    // 网络错误
    return {
      success: false,
      error: "网络连接失败",
    };
  } else {
    // 其他错误
    return {
      success: false,
      error: error.message || "未知错误",
    };
  }
};

export default httpClient;
