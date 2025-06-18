import { authApi } from "../api/auth";
import { mcpApi } from "../api/mcp";
import { rulesApi } from "../api/rules";
import { userApi } from "../api/user";
import { handleApiError } from "../utils/httpUtils";

// 用户认证服务
export const authService = {
  // 登录或创建用户
  async loginOrCreateUser(
    email: string,
    username?: string,
    cursorUserId?: string,
    avatar?: string,
  ) {
    try {
      console.log("正在进行用户认证...", email);
      const response = await authApi.emailLogin(
        email,
        username,
        cursorUserId,
        avatar,
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("用户认证失败:", error);
      return handleApiError(error);
    }
  },
};

// 用户数据服务
export const userService = {
  // 获取用户信息
  async getUserInfo(email: string) {
    try {
      console.log("正在获取用户信息...", email);
      const response = await userApi.getUserInfo(email);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("获取用户信息失败:", error);
      return handleApiError(error);
    }
  },

  // 获取用户规则
  async getUserRules() {
    try {
      console.log("正在获取用户规则...");
      const response = await rulesApi.getUserRules();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("获取用户规则失败:", error);
      return handleApiError(error);
    }
  },

  // 保存用户规则
  async saveUserRules(
    rules: Array<{ ruleName: string; ruleContent: string; sortOrder?: number }>,
  ) {
    try {
      console.log("正在保存用户规则...", rules);
      const response = await rulesApi.saveUserRules(rules);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("保存用户规则失败:", error);
      return handleApiError(error);
    }
  },

  // 删除用户规则
  async deleteUserRules(ruleId: number) {
    try {
      console.log("正在删除用户规则...", ruleId);
      const response = await rulesApi.deleteUserRules(ruleId);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("删除用户规则失败:", error);
      return handleApiError(error);
    }
  },
};

// MCP服务器配置服务
export const mcpService = {
  // 获取MCP服务器配置
  async getMcpServers() {
    try {
      console.log("正在获取MCP服务器...");
      const response = await mcpApi.getMcpServers();
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("获取MCP服务器失败:", error);
      return handleApiError(error);
    }
  },

  // 保存MCP服务器配置
  async saveMcpServers(
    mcps: Array<{
      serverName: string;
      command: string;
      args?: string[];
      env?: Record<string, string>;
      sortOrder?: number;
    }>,
  ) {
    try {
      console.log("正在保存MCP服务器...", mcps);
      const response = await mcpApi.saveMcpServers(mcps);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("保存MCP服务器失败:", error);
      return handleApiError(error);
    }
  },

  // 删除MCP服务器配置
  async deleteMcpServers(serverId: number) {
    try {
      console.log("正在删除MCP服务器...", serverId);
      const response = await mcpApi.deleteMcpServers(serverId);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("删除MCP服务器失败:", error);
      return handleApiError(error);
    }
  },
};
