import { httpRequest } from "../utils/httpUtils";

/**
 * 规则数据类型定义
 */
export interface RuleItem {
  name: string;
  content: string;
  description?: string;
  type?: string;
  order?: number;
  enabled?: boolean;
}

export interface RuleResponse {
  rules: RuleItem[];
}

/**
 * 规则管理相关API
 */
export const rulesApi = {
  /**
   * 获取用户规则
   * @returns Promise<RuleResponse>
   */
  getUserRules: async (): Promise<RuleResponse> => {
    const response = await httpRequest("GET", "/cursor/rules");
    return response.data as RuleResponse;
  },

  /**
   * 同步用户规则到云端
   * @param rules 规则数组
   * @returns Promise<{success: boolean; message: string}>
   */
  syncUserRules: async (
    rules: RuleItem[],
  ): Promise<{ success: boolean; message: string }> => {
    const response = await httpRequest("POST", "/cursor/sync/rules", { rules });

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
   * 删除用户规则
   * @param ruleId 规则ID
   * @returns Promise<{success: boolean; message: string}>
   */
  deleteUserRule: async (
    ruleId: number,
  ): Promise<{ success: boolean; message: string }> => {
    const response = await httpRequest("DELETE", `/cursor/rules/${ruleId}`);
    return response.data as { success: boolean; message: string };
  },
};
