import { httpRequest } from "../utils/httpUtils";

/**
 * 规则数据类型定义
 */
export interface RuleItem {
  ruleName: string;
  ruleContent: string;
  sortOrder?: number;
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
