<template>
  <div class="basic-info">
    <!-- 状态检查区域 -->
    <a-card title="状态检查" size="small" class="section-card">
      <div class="status-section">
        <a-space direction="vertical" style="width: 100%">
          <div class="status-item">
            <a-space>
              <a-badge :status="cursorStatus.installed ? 'success' : 'error'" />
              <span>
                Cursor 安装状态:
                {{ cursorStatus.installed ? "已安装" : "未安装" }}
              </span>
              <a-button
                size="small"
                @click="$emit('checkStatus')"
                :loading="loading.status"
              >
                刷新状态
              </a-button>
              <a-button
                v-if="!cursorStatus.installed"
                size="small"
                type="primary"
                @click="$emit('showCustomPath')"
              >
                设置安装路径
              </a-button>
            </a-space>
          </div>

          <div v-if="cursorStatus.installed" class="status-details">
            <a-descriptions size="small" :column="1" bordered>
              <a-descriptions-item label="操作系统">
                {{ getPlatformName(systemInfo.platform) }}
              </a-descriptions-item>
              <a-descriptions-item label="配置文件路径">
                <a-typography-text
                  :copyable="systemInfo.configPath !== '未找到'"
                  code
                >
                  {{ systemInfo.configPath }}
                </a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item label="MCP 配置路径">
                <a-typography-text
                  :copyable="systemInfo.mcpPath !== '未找到'"
                  code
                >
                  {{ systemInfo.mcpPath }}
                </a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item label="规则文件路径">
                <a-typography-text
                  :copyable="systemInfo.rulesPath !== '未找到'"
                  code
                >
                  {{ systemInfo.rulesPath }}
                </a-typography-text>
              </a-descriptions-item>
              <a-descriptions-item label="CLI 工具路径">
                <a-typography-text
                  :copyable="systemInfo.cliPath !== '未找到'"
                  code
                >
                  {{ systemInfo.cliPath }}
                </a-typography-text>
              </a-descriptions-item>
            </a-descriptions>
          </div>
        </a-space>
      </div>
    </a-card>

    <!-- 用户信息区域 -->
    <a-card
      title="用户信息"
      size="small"
      class="section-card"
      style="margin-top: 16px"
    >
      <div class="user-info-section">
        <a-space direction="vertical" style="width: 100%">
          <div class="user-status">
            <a-space>
              <a-badge
                :status="cursorUserInfo.isLoggedIn ? 'success' : 'default'"
              />
              <span>
                Cursor 登录状态:
                {{ cursorUserInfo.isLoggedIn ? "已登录" : "未登录" }}
              </span>
              <a-button
                size="small"
                @click="$emit('loadUserInfo')"
                :loading="loading.userInfo"
              >
                刷新用户信息
              </a-button>
            </a-space>
          </div>

          <div v-if="cursorUserInfo.isLoggedIn" class="user-details">
            <a-descriptions size="small" :column="1" bordered>
              <a-descriptions-item label="用户邮箱">
                <a-space>
                  <a-typography-text :copyable="!!cursorUserInfo.email" code>
                    {{ cursorUserInfo.email || "未获取到邮箱" }}
                  </a-typography-text>
                  <a-button
                    v-if="cursorUserInfo.email"
                    size="small"
                    type="primary"
                    @click="$emit('syncToCloud')"
                    :loading="loading.syncToCloud"
                  >
                    <template #icon><CloudUploadOutlined /></template>
                    同步到云端
                  </a-button>
                </a-space>
              </a-descriptions-item>
              <a-descriptions-item
                v-if="cursorUserInfo.username"
                label="用户名称"
              >
                <a-typography-text code>
                  {{ cursorUserInfo.username }}
                </a-typography-text>
              </a-descriptions-item>
            </a-descriptions>
          </div>

          <div v-else class="user-login-hint">
            <a-alert
              message="提示"
              description="请先在 Cursor 中登录您的账户，然后点击刷新用户信息按钮获取登录状态。"
              type="info"
              show-icon
            />
          </div>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { CloudUploadOutlined } from "@ant-design/icons-vue";

interface Props {
  cursorStatus: {
    installed: boolean;
  };
  systemInfo: {
    platform: string;
    configPath: string;
    mcpPath: string;
    rulesPath: string;
    cliPath: string;
  };
  cursorUserInfo: {
    isLoggedIn: boolean;
    email: string;
    username?: string;
    cursorUserId?: string;
    avatar?: string;
    token?: string;
  };
  loading: {
    status: boolean;
    userInfo: boolean;
    syncToCloud: boolean;
  };
}

defineProps<Props>();

defineEmits<{
  checkStatus: [];
  showCustomPath: [];
  loadUserInfo: [];
  syncToCloud: [];
}>();

const getPlatformName = (platform: string) => {
  const platformMap: Record<string, string> = {
    darwin: "macOS",
    win32: "Windows",
    linux: "Linux",
  };
  return platformMap[platform] || platform;
};
</script>

<style scoped>
.basic-info {
  width: 100%;
}

.section-card {
  margin-bottom: 16px;
}

.status-section,
.user-info-section {
  width: 100%;
}

.status-details,
.user-details {
  margin-top: 16px;
}

.user-login-hint {
  margin-top: 16px;
}
</style>
