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
};
