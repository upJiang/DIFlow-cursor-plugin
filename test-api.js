// 简单的API测试脚本
const axios = require("axios");

// 测试配置
const config = {
  development: {
    baseURL: "http://localhost:6666/diflow/api",
    name: "开发环境",
  },
  production: {
    baseURL: "http://junfeng530.xyz/diflow/api",
    name: "生产环境",
  },
};

// 获取环境参数
const env = process.argv[2] || "development";
const apiConfig = config[env];

if (!apiConfig) {
  console.error("无效的环境参数，请使用: development 或 production");
  process.exit(1);
}

console.log(`\n=== ${apiConfig.name}API测试 ===`);
console.log(`API基础URL: ${apiConfig.baseURL}`);

// 创建axios实例
const httpClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 测试函数
async function testAPI() {
  const testUserEmail = "test@example.com";
  let authToken = "";

  try {
    // 1. 测试网络连接
    console.log("\n1. 测试网络连接...");
    try {
      const healthUrl = apiConfig.baseURL.replace("/api", "/health");
      const healthResponse = await axios.get(healthUrl, { timeout: 5000 });
      console.log(`✅ 网络连接正常，服务器响应: ${healthResponse.status}`);
    } catch (error) {
      console.log(`⚠️  健康检查失败: ${error.message}`);
      console.log("继续进行API测试...");
    }

    // 2. 测试用户认证
    console.log("\n2. 测试用户认证...");
    const authResponse = await httpClient.post("/auth", {
      userEmail: testUserEmail,
    });
    console.log("✅ 认证成功:", authResponse.data);

    if (authResponse.data && authResponse.data.token) {
      authToken = authResponse.data.token;
      console.log(`获取到认证token: ${authToken}`);
    } else {
      console.log("❌ 认证失败，无法获取token");
      return;
    }

    // 3. 测试获取用户信息
    console.log("\n3. 测试获取用户信息...");
    const userInfoResponse = await httpClient.get(`/user/${testUserEmail}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log("✅ 用户信息:", userInfoResponse.data);

    // 4. 测试获取用户规则
    console.log("\n4. 测试获取用户规则...");
    const userRulesResponse = await httpClient.get(
      `/user/${testUserEmail}/rules`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    console.log("✅ 用户规则:", userRulesResponse.data);

    // 5. 测试保存用户规则
    console.log("\n5. 测试保存用户规则...");
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
    const saveRulesResponse = await httpClient.put(
      `/user/${testUserEmail}/rules`,
      { rules: testRules },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log("✅ 保存规则成功:", saveRulesResponse.data);

    // 6. 测试获取MCP服务器配置
    console.log("\n6. 测试获取MCP服务器配置...");
    const mcpServersResponse = await httpClient.get(
      `/user/${testUserEmail}/mcps`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    console.log("✅ MCP服务器配置:", mcpServersResponse.data);

    // 7. 测试保存MCP服务器配置
    console.log("\n7. 测试保存MCP服务器配置...");
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
    const saveMcpResponse = await httpClient.put(
      `/user/${testUserEmail}/mcps`,
      { mcps: testMcpConfig },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log("✅ 保存MCP配置成功:", saveMcpResponse.data);

    console.log("\n🎉 所有API测试完成！");
  } catch (error) {
    console.error("\n❌ API测试失败:");
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error(`响应数据:`, error.response.data);
    } else if (error.request) {
      console.error("网络请求失败:", error.message);
    } else {
      console.error("错误:", error.message);
    }
  }
}

// 运行测试
testAPI();
