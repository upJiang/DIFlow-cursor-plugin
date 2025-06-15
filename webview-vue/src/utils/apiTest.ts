import {
  authService,
  mcpService,
  userService,
} from "../services/pluginService";

// API测试函数
export const testApiCalls = async () => {
  console.log("=== 开始API测试 ===");
  console.log(
    "当前API基础URL:",
    import.meta.env.VITE_API_BASE_URL || "http://localhost:6666/diflow/api",
  );

  // 测试用户邮箱
  const testUserEmail = "test@example.com";
  let authToken = "";

  try {
    // 1. 测试用户认证
    console.log("\n1. 测试用户认证...");
    const authResult = await authService.loginOrCreateUser(testUserEmail);
    console.log("认证结果:", authResult);

    if (authResult.success && authResult.data?.token) {
      authToken = authResult.data.token;
      console.log("获取到认证token:", authToken);
    } else {
      console.error("认证失败，无法继续测试");
      return;
    }

    // 2. 测试获取用户信息
    console.log("\n2. 测试获取用户信息...");
    const userInfoResult = await userService.getUserInfo(
      testUserEmail,
      authToken,
    );
    console.log("用户信息结果:", userInfoResult);

    // 3. 测试获取用户规则
    console.log("\n3. 测试获取用户规则...");
    const userRulesResult = await userService.getUserRules(
      testUserEmail,
      authToken,
    );
    console.log("用户规则结果:", userRulesResult);

    // 4. 测试保存用户规则
    console.log("\n4. 测试保存用户规则...");
    const testRules = {
      rules: [
        {
          id: "test-rule-1",
          name: "测试规则",
          content: "这是一个测试规则",
          enabled: true,
        },
      ],
    };
    const saveRulesResult = await userService.saveUserRules(
      testUserEmail,
      testRules,
      authToken,
    );
    console.log("保存规则结果:", saveRulesResult);

    // 5. 测试获取MCP服务器配置
    console.log("\n5. 测试获取MCP服务器配置...");
    const mcpServersResult = await mcpService.getMcpServers(
      testUserEmail,
      authToken,
    );
    console.log("MCP服务器配置结果:", mcpServersResult);

    // 6. 测试保存MCP服务器配置
    console.log("\n6. 测试保存MCP服务器配置...");
    const testMcpConfig = {
      servers: [
        {
          name: "test-mcp-server",
          command: "node",
          args: ["test-server.js"],
          env: {},
        },
      ],
    };
    const saveMcpResult = await mcpService.saveMcpServers(
      testUserEmail,
      testMcpConfig,
      authToken,
    );
    console.log("保存MCP配置结果:", saveMcpResult);

    console.log("\n=== API测试完成 ===");
  } catch (error) {
    console.error("API测试过程中发生错误:", error);
  }
};

// 网络连接测试
export const testNetworkConnection = async () => {
  console.log("=== 测试网络连接 ===");
  const baseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:6666/diflow/api";

  try {
    const response = await fetch(baseUrl.replace("/api", "/health"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log("网络连接正常，服务器响应:", response.status);
    } else {
      console.warn("服务器响应异常:", response.status, response.statusText);
    }
  } catch (error) {
    console.error("网络连接失败:", error);
  }
};

// 导出测试函数供外部调用
export default {
  testApiCalls,
  testNetworkConnection,
};
