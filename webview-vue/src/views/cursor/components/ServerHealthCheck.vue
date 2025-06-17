<template>
  <div class="server-health-check">
    <div class="health-status">
      <div
        class="status-indicator"
        :class="{
          'status-healthy': serverHealth.overall,
          'status-unhealthy': !serverHealth.overall,
        }"
      >
        <div class="status-dot"></div>
        <span class="status-text">
          {{ serverHealth.overall ? "服务端正常" : "服务端异常" }}
        </span>
      </div>

      <div class="health-summary" v-if="serverHealth.lastCheck">
        <span class="check-time">
          最后检查: {{ formatTime(serverHealth.lastCheck) }}
        </span>
        <span class="success-rate">
          成功率: {{ serverHealth.summary.success }}/{{
            serverHealth.summary.total
          }}
        </span>
      </div>
    </div>

    <div class="health-actions">
      <a-button
        type="primary"
        :loading="loading"
        @click="checkHealth"
        size="small"
      >
        检查服务端
      </a-button>

      <a-button
        v-if="serverHealth.results.length > 0"
        @click="showDetails = !showDetails"
        size="small"
      >
        {{ showDetails ? "隐藏详情" : "查看详情" }}
      </a-button>
    </div>

    <div
      v-if="showDetails && serverHealth.results.length > 0"
      class="health-details"
    >
      <div
        v-for="(result, index) in serverHealth.results"
        :key="index"
        class="endpoint-result"
        :class="{
          'result-success': result.success,
          'result-error': !result.success,
        }"
      >
        <div class="result-header">
          <span class="endpoint-name">{{ result.endpoint }}</span>
          <span class="response-time" v-if="result.responseTime">
            {{ result.responseTime }}ms
          </span>
        </div>
        <div class="result-message">{{ result.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "ant-design-vue";
import { onMounted, ref } from "vue";

import {
  getServerHealth,
  type HealthCheckResult,
} from "../../../utils/serverHealthCheck";

// Props
interface Props {
  autoCheck?: boolean;
  baseUrl?: string;
  onHealthChange?: (health: boolean) => void;
}

const props = withDefaults(defineProps<Props>(), {
  autoCheck: true,
  baseUrl: "http://localhost:3000",
});

// 状态
const loading = ref(false);
const showDetails = ref(false);
const serverHealth = ref({
  overall: false,
  lastCheck: null as Date | null,
  results: [] as HealthCheckResult[],
  summary: {
    total: 0,
    success: 0,
    failed: 0,
    required: 0,
    requiredSuccess: 0,
  },
});

// 格式化时间
const formatTime = (date: Date) => {
  return date.toLocaleTimeString();
};

// 检查服务端健康状态
const checkHealth = async () => {
  loading.value = true;
  try {
    const health = await getServerHealth(props.baseUrl, 5000);

    serverHealth.value = {
      ...health,
      lastCheck: new Date(),
    };

    if (health.overall) {
      message.success(`服务端连接正常`, 2);
    } else {
      message.warning(`服务端部分异常`, 2);
    }

    // 通知父组件健康状态变化
    props.onHealthChange?.(health.overall);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    message.error(`服务端连接失败: ${errorMessage}`, 3);

    serverHealth.value = {
      overall: false,
      lastCheck: new Date(),
      results: [],
      summary: {
        total: 0,
        success: 0,
        failed: 0,
        required: 0,
        requiredSuccess: 0,
      },
    };

    props.onHealthChange?.(false);
  } finally {
    loading.value = false;
  }
};

// 自动检查
onMounted(() => {
  if (props.autoCheck) {
    setTimeout(() => {
      checkHealth();
    }, 2000);
  }
});

// 暴露方法给父组件
defineExpose({
  checkHealth,
  serverHealth,
});
</script>

<style scoped>
.server-health-check {
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
}

.health-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff4d4f;
}

.status-healthy .status-dot {
  background: #52c41a;
}

.status-text {
  font-weight: 500;
}

.health-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 12px;
  color: #666;
  gap: 2px;
}

.health-actions {
  display: flex;
  gap: 8px;
}

.health-details {
  margin-top: 12px;
  border-top: 1px solid #e8e8e8;
  padding-top: 12px;
}

.endpoint-result {
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  border-left: 3px solid #ff4d4f;
  background: #fff2f0;
}

.result-success {
  border-left-color: #52c41a;
  background: #f6ffed;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.endpoint-name {
  font-weight: 500;
  font-size: 12px;
}

.response-time {
  font-size: 11px;
  color: #666;
}

.result-message {
  font-size: 12px;
  color: #666;
}
</style>
