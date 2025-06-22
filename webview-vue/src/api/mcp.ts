import { httpRequest } from "../utils/httpUtils";

/**
 * MCP数据类型定义
 */
export interface McpServerItem {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  description?: string;
  enabled?: boolean;
}

export interface McpResponse {
  mcps: McpServerItem[];
}

/**
 * JSON 配置相关接口定义
 */
export interface McpConfigJsonResponse {
  mcpConfig: Record<string, McpServerItem>;
}

export interface BatchUpdateMcpConfigRequest {
  mcpConfig: Record<string, McpServerItem>;
}

export interface BatchUpdateMcpConfigResponse {
  success: boolean;
  message: string;
  count: number;
}

export interface ShareMcpConfigRequest {
  title: string;
  description?: string;
  mcpConfig?: Record<string, McpServerItem>;
}

export interface ShareMcpConfigResponse {
  success: boolean;
  message: string;
  shareId: string;
}

export interface SharedMcpConfig {
  shareId: string;
  title: string;
  description?: string;
  creatorEmail: string;
  usageCount: number;
  mcpConfig: Record<string, McpServerItem>;
}

export interface GetMcpConfigByShareIdResponse {
  success: boolean;
  message: string;
  data: SharedMcpConfig;
}

export interface AddMcpByShareIdRequest {
  shareId: string;
}

export interface AddMcpByShareIdResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

/**
 * MCP服务器相关API
 */
export const mcpApi = {
  /**
   * 获取MCP服务器列表
   * @returns Promise<McpResponse>
   */
  getMcpServers: async (): Promise<McpResponse> => {
    const response = await httpRequest("GET", "/cursor/mcps");
    return response.data as McpResponse;
  },

  /**
   * 保存MCP服务器配置
   * @param mcps MCP服务器数组
   * @returns Promise<{success: boolean; message: string}>
   */
  saveMcpServers: async (
    mcps: McpServerItem[],
  ): Promise<{ success: boolean; message: string }> => {
    const response = await httpRequest("PUT", "/cursor/mcps", { mcps });
    return response.data as { success: boolean; message: string };
  },

  /**
   * 同步MCP服务器到云端
   * @param mcps MCP服务器数组
   * @returns Promise<{success: boolean; message: string}>
   */
  syncMcpServers: async (
    mcps: McpServerItem[],
  ): Promise<{ success: boolean; message: string }> => {
    const response = await httpRequest("POST", "/cursor/sync/mcps", { mcps });

    // 处理嵌套的响应数据结构
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      const innerData = response.data.data as {
        success: boolean;
        message: string;
      };
      return {
        success: innerData.success || false,
        message: innerData.message || "同步失败",
      };
    }

    // 兼容直接返回的格式
    return response.data as { success: boolean; message: string };
  },

  /**
   * 删除MCP服务器
   * @param serverId 服务器ID
   * @returns Promise<{success: boolean; message: string}>
   */
  deleteMcpServer: async (
    serverId: number,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await httpRequest("DELETE", `/cursor/mcps/${serverId}`);
    return response.data as { success: boolean; message: string };
  },

  /**
   * 删除多个MCP服务器（兼容pluginService调用）
   * @param serverId 服务器ID
   * @returns Promise<{success: boolean; message: string}>
   */
  deleteMcpServers: (
    serverId: number,
  ): Promise<{ success: boolean; message: string }> => {
    return mcpApi.deleteMcpServer(serverId);
  },

  /**
   * 获取MCP配置JSON格式
   * @returns Promise<McpConfigJsonResponse>
   */
  getMcpConfigJson: async (): Promise<McpConfigJsonResponse> => {
    const response = await httpRequest("GET", "/cursor/mcps/json");
    return response.data as McpConfigJsonResponse;
  },

  /**
   * 批量更新MCP配置
   * @param mcpConfig MCP配置对象
   * @returns Promise<BatchUpdateMcpConfigResponse>
   */
  batchUpdateMcpConfig: async (
    mcpConfig: Record<string, McpServerItem>,
  ): Promise<BatchUpdateMcpConfigResponse> => {
    const response = await httpRequest("PUT", "/cursor/mcps/batch", {
      mcpConfig,
    });
    return response.data as BatchUpdateMcpConfigResponse;
  },

  /**
   * 分享MCP配置
   * @param mcpConfig MCP配置对象
   * @returns Promise<ShareMcpConfigResponse>
   */
  shareMcpConfig: async (
    title: string,
    description?: string,
    mcpConfig?: Record<string, McpServerItem>,
  ): Promise<ShareMcpConfigResponse> => {
    const response = await httpRequest("POST", "/cursor/mcps/share", {
      title: title || "MCP配置分享",
      description: description || "用户分享的MCP配置",
      mcpConfig,
    });

    // 处理服务端响应格式
    if (response.data && typeof response.data === "object") {
      const serverResponse = response.data as {
        code: number;
        message: string;
        data?: { shareId: string };
      };

      if (serverResponse.code === 201 && serverResponse.data) {
        return {
          success: true,
          message: serverResponse.message || "分享成功",
          shareId: serverResponse.data.shareId,
        };
      } else {
        return {
          success: false,
          message: serverResponse.message || "分享失败",
          shareId: "",
        };
      }
    }

    return {
      success: false,
      message: "响应格式错误",
      shareId: "",
    };
  },

  /**
   * 通过分享ID获取MCP配置
   * @param shareId 分享ID
   * @returns Promise<GetMcpConfigByShareIdResponse>
   */
  getMcpConfigByShareId: async (
    shareId: string,
  ): Promise<GetMcpConfigByShareIdResponse> => {
    const response = await httpRequest("GET", `/cursor/mcps/share/${shareId}`);

    // 处理服务端响应格式
    if (response.data && typeof response.data === "object") {
      const serverResponse = response.data as {
        code: number;
        message: string;
        data?: {
          shareId: string;
          title: string;
          description?: string;
          creatorEmail: string;
          usageCount: number;
          mcpConfig: Record<string, McpServerItem>;
        };
      };

      if (serverResponse.code === 200 && serverResponse.data) {
        return {
          success: true,
          message: serverResponse.message || "获取成功",
          data: {
            shareId: serverResponse.data.shareId,
            title: serverResponse.data.title,
            description: serverResponse.data.description,
            creatorEmail: serverResponse.data.creatorEmail,
            usageCount: serverResponse.data.usageCount,
            mcpConfig: serverResponse.data.mcpConfig,
          },
        };
      } else {
        return {
          success: false,
          message: serverResponse.message || "获取失败",
          data: {} as SharedMcpConfig,
        };
      }
    }

    return {
      success: false,
      message: "响应格式错误",
      data: {} as SharedMcpConfig,
    };
  },

  /**
   * 通过分享ID添加MCP配置
   * @param shareId 分享ID
   * @returns Promise<AddMcpByShareIdResponse>
   */
  addMcpByShareId: async (
    shareId: string,
  ): Promise<AddMcpByShareIdResponse> => {
    const response = await httpRequest("POST", "/cursor/mcps/add-by-share", {
      shareId,
    });
    return response.data as AddMcpByShareIdResponse;
  },
};
