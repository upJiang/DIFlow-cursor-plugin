<template>
  <div class="api-test-container">
    <h2>API接口测试</h2>

    <div class="test-info">
      <p>
        <strong>当前环境:</strong>
        {{ currentEnv }}
      </p>
      <p>
        <strong>API基础URL:</strong>
        {{ apiBaseUrl }}
      </p>
    </div>

    <div class="test-buttons">
      <button @click="testNetworkConnection" :disabled="testing">
        {{ testing ? "测试中..." : "测试网络连接" }}
      </button>
      <button @click="testAllApis" :disabled="testing">
        {{ testing ? "测试中..." : "测试所有API" }}
      </button>
      <button @click="clearLogs">清空日志</button>
    </div>

    <div class="test-logs">
      <h3>测试日志:</h3>
      <div class="logs-container" ref="logsContainer">
        <div
          v-for="(log, index) in logs"
          :key="index"
          :class="['log-item', log.type]"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-content">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";

import {
  authService,
  mcpService,
  userService,
} from "../../services/pluginService";

interface LogItem {
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warn";
}

const testing = ref(false);
const logs = ref<LogItem[]>([]);
const logsContainer = ref<HTMLElement>();
const currentEnv = ref("development");
const apiBaseUrl = ref("http://localhost:3001/diflow/api");

// 添加日志
const addLog = (message: string, type: LogItem["type"] = "info") => {
  const now = new Date();
  const time = now.toLocaleTimeString();
  logs.value.push({ time, message, type });

  nextTick(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  });
};

// 清空日志
const clearLogs = () => {
  logs.value = [];
};

// 测试网络连接
const testNetworkConnection = async () => {
  testing.value = true;
  addLog("=== 开始测试网络连接 ===", "info");

  try {
    const healthUrl = apiBaseUrl.value.replace("/api", "/health");
    addLog(`尝试连接: ${healthUrl}`, "info");

    const response = await fetch(healthUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      addLog(`网络连接正常，服务器响应: ${response.status}`, "success");
    } else {
      addLog(
        `服务器响应异常: ${response.status} ${response.statusText}`,
        "warn",
      );
    }
  } catch (error) {
    addLog(`网络连接失败: ${error}`, "error");
  }

  testing.value = false;
};

// 测试所有API
const testAllApis = async () => {
  testing.value = true;
  addLog("=== 开始API测试 ===", "info");
  addLog(`当前API基础URL: ${apiBaseUrl.value}`, "info");

  const testUserEmail = "test@example.com";
  let authToken = "";

  try {
    // 1. 测试用户认证
    addLog("1. 测试用户认证...", "info");
    const authResult = await authService.loginOrCreateUser(testUserEmail);
    addLog(`认证结果: ${JSON.stringify(authResult)}`, "info");

    if (authResult.success && authResult.data?.token) {
      authToken = authResult.data.token;
      addLog(`获取到认证token: ${authToken}`, "success");
    } else {
      addLog("认证失败，无法继续测试", "error");
      testing.value = false;
      return;
    }

    // 2. 测试获取用户信息
    addLog("2. 测试获取用户信息...", "info");
    const userInfoResult = await userService.getUserInfo(
      testUserEmail,
      authToken,
    );
    addLog(`用户信息结果: ${JSON.stringify(userInfoResult)}`, "info");

    // 3. 测试获取用户规则
    addLog("3. 测试获取用户规则...", "info");
    const userRulesResult = await userService.getUserRules(
      testUserEmail,
      authToken,
    );
    addLog(`用户规则结果: ${JSON.stringify(userRulesResult)}`, "info");

    // 4. 测试保存用户规则
    addLog("4. 测试保存用户规则...", "info");
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
    addLog(`保存规则结果: ${JSON.stringify(saveRulesResult)}`, "info");

    // 5. 测试获取MCP服务器配置
    addLog("5. 测试获取MCP服务器配置...", "info");
    const mcpServersResult = await mcpService.getMcpServers(
      testUserEmail,
      authToken,
    );
    addLog(`MCP服务器配置结果: ${JSON.stringify(mcpServersResult)}`, "info");

    // 6. 测试保存MCP服务器配置
    addLog("6. 测试保存MCP服务器配置...", "info");
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
    addLog(`保存MCP配置结果: ${JSON.stringify(saveMcpResult)}`, "info");

    addLog("=== API测试完成 ===", "success");
  } catch (error) {
    addLog(`API测试过程中发生错误: ${error}`, "error");
  }

  testing.value = false;
};

onMounted(() => {
  // 检测当前环境
  if (import.meta.env.MODE === "production") {
    currentEnv.value = "production";
    apiBaseUrl.value = "http://junfeng530.xyz/diflow/api";
  } else {
    currentEnv.value = "development";
    apiBaseUrl.value = "http://localhost:3001/diflow/api";
  }

  addLog("API测试页面已加载", "info");
  addLog(`当前环境: ${currentEnv.value}`, "info");
  addLog(`API基础URL: ${apiBaseUrl.value}`, "info");
});
</script>

<style scoped>
.api-test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.test-info p {
  margin: 5px 0;
}

.test-buttons {
  margin-bottom: 20px;
}

.test-buttons button {
  margin-right: 10px;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.test-buttons button:first-child,
.test-buttons button:nth-child(2) {
  background: #007acc;
  color: white;
}

.test-buttons button:last-child {
  background: #666;
  color: white;
}

.test-buttons button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.test-logs {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.test-logs h3 {
  background: #f8f8f8;
  margin: 0;
  padding: 10px 15px;
  border-bottom: 1px solid #ddd;
}

.logs-container {
  height: 400px;
  overflow-y: auto;
  padding: 10px;
  background: #fafafa;
}

.log-item {
  margin-bottom: 8px;
  padding: 5px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.4;
}

.log-item.info {
  background: #e3f2fd;
  color: #1976d2;
}

.log-item.success {
  background: #e8f5e8;
  color: #2e7d32;
}

.log-item.error {
  background: #ffebee;
  color: #c62828;
}

.log-item.warn {
  background: #fff3e0;
  color: #f57c00;
}

.log-time {
  color: #666;
  margin-right: 10px;
}

.log-content {
  word-break: break-all;
}
</style>
