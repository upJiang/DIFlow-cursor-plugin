<template>
  <div class="cloud-sync">
    <a-card title="云端数据同步" size="small" class="section-card">
      <div class="sync-section">
        <a-space direction="vertical" style="width: 100%">
          <!-- 用户状态区域 -->
          <div class="user-status">
            <a-card size="small" title="用户状态">
              <div v-if="!userInfo.isLoggedIn" class="login-section">
                <a-space direction="vertical" style="width: 100%">
                  <a-alert
                    message="未登录"
                    description="请先登录以使用云同步功能"
                    type="warning"
                    show-icon
                  />
                  <a-button
                    type="primary"
                    @click="$emit('loginUser')"
                    :loading="loading.login"
                    size="large"
                  >
                    <template #icon><UserOutlined /></template>
                    使用 Cursor 账户登录
                  </a-button>
                </a-space>
              </div>
              <div v-else class="user-info">
                <a-descriptions size="small" :column="1" bordered>
                  <a-descriptions-item label="用户邮箱">
                    {{ userInfo.email }}
                  </a-descriptions-item>
                  <a-descriptions-item label="用户名" v-if="userInfo.username">
                    {{ userInfo.username }}
                  </a-descriptions-item>
                  <a-descriptions-item label="登录状态">
                    <a-badge status="success" text="已登录" />
                  </a-descriptions-item>
                  <a-descriptions-item
                    label="最后同步时间"
                    v-if="syncInfo.lastSyncTime"
                  >
                    {{ formatTime(syncInfo.lastSyncTime) }}
                  </a-descriptions-item>
                </a-descriptions>
                <div style="margin-top: 16px">
                  <a-space>
                    <a-button
                      @click="$emit('logoutUser')"
                      :loading="loading.logout"
                    >
                      退出登录
                    </a-button>
                    <a-button
                      type="primary"
                      @click="$emit('syncAllData')"
                      :loading="loading.syncAll"
                    >
                      <template #icon><SyncOutlined /></template>
                      立即同步
                    </a-button>
                  </a-space>
                </div>
              </div>
            </a-card>
          </div>

          <!-- 同步操作区域 -->
          <div v-if="userInfo.isLoggedIn" class="sync-operations">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-card size="small" title="规则同步">
                  <a-space direction="vertical" style="width: 100%">
                    <div class="sync-status">
                      <a-space>
                        <a-badge
                          :status="
                            syncInfo.rulesStatus === 'synced'
                              ? 'success'
                              : 'warning'
                          "
                        />
                        <span>
                          状态:
                          {{ getSyncStatusText(syncInfo.rulesStatus) }}
                        </span>
                      </a-space>
                    </div>
                    <a-space>
                      <a-button
                        @click="$emit('syncRulesToCloud')"
                        :loading="loading.syncRules"
                        size="small"
                      >
                        <template #icon>
                          <CloudUploadOutlined />
                        </template>
                        上传到云端
                      </a-button>
                      <a-button
                        @click="$emit('syncRulesFromCloud')"
                        :loading="loading.syncRules"
                        size="small"
                      >
                        <template #icon>
                          <CloudDownloadOutlined />
                        </template>
                        从云端下载
                      </a-button>
                    </a-space>
                  </a-space>
                </a-card>
              </a-col>
              <a-col :span="12">
                <a-card size="small" title="MCP 同步">
                  <a-space direction="vertical" style="width: 100%">
                    <div class="sync-status">
                      <a-space>
                        <a-badge
                          :status="
                            syncInfo.mcpStatus === 'synced'
                              ? 'success'
                              : 'warning'
                          "
                        />
                        <span>
                          状态:
                          {{ getSyncStatusText(syncInfo.mcpStatus) }}
                        </span>
                      </a-space>
                    </div>
                    <a-space>
                      <a-button
                        @click="$emit('syncMcpToCloud')"
                        :loading="loading.syncMcp"
                        size="small"
                      >
                        <template #icon>
                          <CloudUploadOutlined />
                        </template>
                        上传到云端
                      </a-button>
                      <a-button
                        @click="$emit('syncMcpFromCloud')"
                        :loading="loading.syncMcp"
                        size="small"
                      >
                        <template #icon>
                          <CloudDownloadOutlined />
                        </template>
                        从云端下载
                      </a-button>
                    </a-space>
                  </a-space>
                </a-card>
              </a-col>
            </a-row>
          </div>

          <!-- 同步日志 -->
          <div v-if="userInfo.isLoggedIn" class="sync-logs">
            <a-card size="small" title="同步日志">
              <div
                class="logs-container"
                style="max-height: 200px; overflow-y: auto"
              >
                <div
                  v-for="(log, index) in syncLogs"
                  :key="index"
                  :class="['log-item', log.type]"
                  style="padding: 4px 0; border-bottom: 1px solid #f0f0f0"
                >
                  <a-space>
                    <span style="color: #666; font-size: 12px">
                      {{ formatTime(log.time) }}
                    </span>
                    <a-tag
                      :color="
                        log.type === 'success'
                          ? 'green'
                          : log.type === 'error'
                          ? 'red'
                          : 'blue'
                      "
                      size="small"
                    >
                      {{ log.type.toUpperCase() }}
                    </a-tag>
                    <span>{{ log.message }}</span>
                  </a-space>
                </div>
                <div
                  v-if="syncLogs.length === 0"
                  style="text-align: center; color: #999; padding: 20px"
                >
                  暂无同步日志
                </div>
              </div>
              <div style="margin-top: 8px">
                <a-button size="small" @click="$emit('clearSyncLogs')">
                  清空日志
                </a-button>
              </div>
            </a-card>
          </div>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import {
  CloudDownloadOutlined,
  CloudUploadOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons-vue";

interface UserInfo {
  isLoggedIn: boolean;
  email: string;
  username: string;
  token: string;
}

interface SyncInfo {
  lastSyncTime: Date | null;
  rulesStatus: string;
  mcpStatus: string;
}

interface SyncLog {
  time: Date;
  message: string;
  type: "info" | "success" | "error";
}

interface Props {
  userInfo: UserInfo;
  syncInfo: SyncInfo;
  syncLogs: SyncLog[];
  loading: {
    login: boolean;
    logout: boolean;
    syncAll: boolean;
    syncRules: boolean;
    syncMcp: boolean;
  };
}

defineProps<Props>();

defineEmits<{
  loginUser: [];
  logoutUser: [];
  syncAllData: [];
  syncRulesToCloud: [];
  syncRulesFromCloud: [];
  syncMcpToCloud: [];
  syncMcpFromCloud: [];
  clearSyncLogs: [];
}>();

const formatTime = (time: Date | null) => {
  if (!time) return "";
  return time.toLocaleString();
};

const getSyncStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    synced: "已同步",
    pending: "同步中",
    error: "同步失败",
    unknown: "未知",
  };
  return statusMap[status] || status;
};
</script>

<style scoped>
.cloud-sync {
  width: 100%;
}

.section-card {
  margin-bottom: 16px;
}

.sync-section {
  width: 100%;
}

.user-status,
.sync-operations,
.sync-logs {
  margin-bottom: 16px;
}

.login-section,
.user-info {
  width: 100%;
}

.sync-status {
  margin-bottom: 8px;
}

.logs-container {
  background: #fafafa;
  border-radius: 4px;
  padding: 8px;
}

.log-item {
  font-size: 12px;
}
</style>
