import { handleApiError, pluginApi } from "../utils/httpUtils";

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
      const response = await pluginApi.loginOrCreateUser(
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
  async getUserInfo(email: string, token: string) {
    try {
      console.log("正在获取用户信息...", email);
      const response = await pluginApi.getUserInfo(email, token);
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
  async getUserRules(email: string, token: string) {
    try {
      console.log("正在获取用户规则...", email);
      const response = await pluginApi.getUserRules(email, token);
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
    email: string,
    rules: Array<{ ruleName: string; ruleContent: string; sortOrder?: number }>,
    token: string,
  ) {
    try {
      console.log("正在保存用户规则...", email, rules);
      const response = await pluginApi.saveUserRules(email, rules, token);
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
  async deleteUserRules(email: string, ruleId: number, token: string) {
    try {
      console.log("正在删除用户规则...", email, ruleId);
      const response = await pluginApi.deleteUserRules(email, ruleId, token);
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
  async getMcpServers(email: string, token: string) {
    try {
      console.log("正在获取MCP服务器...", email);
      const response = await pluginApi.getMcpServers(email, token);
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
    email: string,
    mcps: Array<{
      serverName: string;
      command: string;
      args?: string[];
      env?: Record<string, string>;
      sortOrder?: number;
    }>,
    token: string,
  ) {
    try {
      console.log("正在保存MCP服务器...", email, mcps);
      const response = await pluginApi.saveMcpServers(email, mcps, token);
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
  async deleteMcpServers(email: string, serverId: number, token: string) {
    try {
      console.log("正在删除MCP服务器...", email, serverId);
      const response = await pluginApi.deleteMcpServers(email, serverId, token);
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
