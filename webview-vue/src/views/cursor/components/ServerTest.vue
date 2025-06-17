<template>
  <a-card title="服务器连接测试" :bordered="false">
    <!-- 连接状态 -->
    <div class="connection-status">
      <a-descriptions title="连接状态" :column="2" bordered>
        <a-descriptions-item label="服务器地址">
          {{ serverConfig.baseURL }}
        </a-descriptions-item>
        <a-descriptions-item label="连接状态">
          <a-badge
            :status="connectionStatus.connected ? 'success' : 'error'"
            :text="connectionStatus.connected ? '已连接' : '未连接'"
          />
        </a-descriptions-item>
        <a-descriptions-item label="最后检查时间">
          {{ connectionStatus.lastCheck || "未检查" }}
        </a-descriptions-item>
        <a-descriptions-item label="响应时间">
          {{
            connectionStatus.responseTime
              ? `${connectionStatus.responseTime}ms`
              : "-"
          }}
        </a-descriptions-item>
        <a-descriptions-item label="错误信息" v-if="connectionStatus.error">
          <span class="error-text">{{ connectionStatus.error }}</span>
        </a-descriptions-item>
      </a-descriptions>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <a-space>
        <a-button
          type="primary"
          :loading="testing"
          @click="testConnection"
          :icon="h(ReloadOutlined)"
        >
          测试连接
        </a-button>
        <a-button
          :loading="testing"
          @click="testAllEndpoints"
          :icon="h(ApiOutlined)"
        >
          测试所有API
        </a-button>
        <a-button @click="clearLogs" :icon="h(ClearOutlined)">
          清空日志
        </a-button>
      </a-space>
    </div>

    <!-- 服务器配置 -->
    <a-card title="服务器配置" size="small" class="config-card">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="16">
            <a-form-item label="服务器地址">
              <a-input
                v-model:value="serverConfig.baseURL"
                placeholder="http://localhost:3001/diflow/api"
                @change="onConfigChange"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="超时时间(ms)">
              <a-input-number
                v-model:value="serverConfig.timeout"
                :min="1000"
                :max="60000"
                :step="1000"
                @change="onConfigChange"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-card>

    <!-- 测试日志 -->
    <a-card title="测试日志" size="small" class="logs-card">
      <div class="logs-container">
        <div v-if="testLogs.length === 0" class="no-logs">暂无测试日志</div>
        <div v-else class="logs-list">
          <div
            v-for="log in testLogs"
            :key="log.id"
            :class="['log-item', log.type]"
          >
            <div class="log-header">
              <span class="log-time">{{ log.timestamp }}</span>
              <a-tag :color="log.type === 'success' ? 'green' : 'red'">
                {{ log.type === "success" ? "成功" : "失败" }}
              </a-tag>
            </div>
            <div class="log-message">{{ log.message }}</div>
            <div v-if="log.details" class="log-details">
              <a-typography-text code>{{ log.details }}</a-typography-text>
            </div>
          </div>
        </div>
      </div>
    </a-card>
  </a-card>
</template>

<script setup lang="ts">
import {
  ApiOutlined,
  ClearOutlined,
  ReloadOutlined,
} from "@ant-design/icons-vue";
import { h, reactive, ref } from "vue";

import {
  DEFAULT_SERVER_CONFIG,
  type ServerConfig,
  type ServerTestResult,
  testMultipleEndpoints,
  testServerConnection,
} from "../../../utils/serverTest";

interface ConnectionStatus {
  connected: boolean;
  lastCheck?: string;
  responseTime?: number;
  error?: string;
}

interface TestLog {
  id: number;
  timestamp: string;
  type: "success" | "error";
  message: string;
  details?: string;
}

// 响应式数据
const testing = ref(false);
const serverConfig = reactive<ServerConfig>({ ...DEFAULT_SERVER_CONFIG });
const connectionStatus = reactive<ConnectionStatus>({
  connected: false,
});
const testLogs = ref<TestLog[]>([]);

let logIdCounter = 0;

// 添加日志
const addLog = (
  type: "success" | "error",
  message: string,
  details?: string,
) => {
  testLogs.value.unshift({
    id: ++logIdCounter,
    timestamp: new Date().toLocaleString(),
    type,
    message,
    details,
  });

  // 限制日志数量
  if (testLogs.value.length > 100) {
    testLogs.value = testLogs.value.slice(0, 100);
  }
};

// 更新连接状态
const updateConnectionStatus = (result: ServerTestResult) => {
  connectionStatus.connected = result.success;
  connectionStatus.lastCheck = new Date().toLocaleString();
  connectionStatus.responseTime = result.responseTime;
  connectionStatus.error = result.success ? undefined : result.message;
};

// 测试连接
const testConnection = async () => {
  testing.value = true;

  try {
    const result = await testServerConnection(serverConfig);
    updateConnectionStatus(result);

    addLog(
      result.success ? "success" : "error",
      result.message,
      result.success
        ? `响应时间: ${result.responseTime}ms`
        : `状态码: ${result.status}`,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    addLog("error", "连接测试失败", errorMessage);
    updateConnectionStatus({
      success: false,
      message: errorMessage,
    });
  } finally {
    testing.value = false;
  }
};

// 测试所有API端点
const testAllEndpoints = async () => {
  testing.value = true;

  const endpoints = [
    { path: "/health", method: "GET" as const },
    { path: "/info", method: "GET" as const },
    {
      path: "/auth",
      method: "POST" as const,
      data: { email: "test@example.com" },
    },
  ];

  try {
    const results = await testMultipleEndpoints(endpoints, serverConfig);

    results.forEach((result) => {
      addLog(
        result.success ? "success" : "error",
        result.message,
        result.success
          ? `响应时间: ${result.responseTime}ms`
          : `状态码: ${result.status}`,
      );
    });

    const successCount = results.filter((r) => r.success).length;
    addLog(
      "success",
      `API测试完成: ${successCount}/${results.length} 个端点测试成功`,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    addLog("error", "API测试失败", errorMessage);
  } finally {
    testing.value = false;
  }
};

// 清空日志
const clearLogs = () => {
  testLogs.value = [];
  addLog("success", "日志已清空");
};

// 配置变更
const onConfigChange = () => {
  addLog("success", "服务器配置已更新");
};

// 初始化时测试连接
testConnection();
</script>

<style scoped>
.connection-status {
  margin-bottom: 16px;
}

.action-buttons {
  margin: 16px 0;
}

.config-card,
.logs-card {
  margin-top: 16px;
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
}

.no-logs {
  text-align: center;
  color: #999;
  padding: 20px;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
}

.log-item.success {
  background-color: #f6ffed;
  border-color: #b7eb8f;
}

.log-item.error {
  background-color: #fff2f0;
  border-color: #ffccc7;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.log-time {
  font-size: 12px;
  color: #666;
}

.log-message {
  font-weight: 500;
  margin-bottom: 4px;
}

.log-details {
  font-size: 12px;
  color: #666;
}

.error-text {
  color: #ff4d4f;
}
</style>
