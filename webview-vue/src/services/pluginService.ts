import { handleApiError, pluginApi } from "../utils/httpUtils";

// 用户认证服务
export const authService = {
  // 登录或创建用户
  async loginOrCreateUser(userEmail: string) {
    try {
      console.log("开始用户认证...", userEmail);
      const response = await pluginApi.auth(userEmail);
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
  async getUserInfo(userEmail: string, token: string) {
    try {
      console.log("获取用户信息...", userEmail);
      const response = await pluginApi.getUserInfo(userEmail, token);
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
  async getUserRules(userEmail: string, token: string) {
    try {
      console.log("获取用户规则...", userEmail);
      const response = await pluginApi.getUserRules(userEmail, token);
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
  async saveUserRules(userEmail: string, rules: any, token: string) {
    try {
      console.log("保存用户规则...", userEmail, rules);
      const response = await pluginApi.saveUserRules(userEmail, rules, token);
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
  async deleteUserRules(userEmail: string, token: string) {
    try {
      console.log("删除用户规则...", userEmail);
      const response = await pluginApi.deleteUserRules(userEmail, token);
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
  async getMcpServers(userEmail: string, token: string) {
    try {
      console.log("获取MCP服务器配置...", userEmail);
      const response = await pluginApi.getMcpServers(userEmail, token);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("获取MCP服务器配置失败:", error);
      return handleApiError(error);
    }
  },

  // 保存MCP服务器配置
  async saveMcpServers(userEmail: string, mcps: any, token: string) {
    try {
      console.log("保存MCP服务器配置...", userEmail, mcps);
      const response = await pluginApi.saveMcpServers(userEmail, mcps, token);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("保存MCP服务器配置失败:", error);
      return handleApiError(error);
    }
  },

  // 删除MCP服务器配置
  async deleteMcpServers(userEmail: string, token: string) {
    try {
      console.log("删除MCP服务器配置...", userEmail);
      const response = await pluginApi.deleteMcpServers(userEmail, token);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("删除MCP服务器配置失败:", error);
      return handleApiError(error);
    }
  },
};
