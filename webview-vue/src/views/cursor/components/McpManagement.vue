<template>
  <div class="mcp-management">
    <a-card title="MCP 服务器管理" size="small" class="section-card">
      <template #extra>
        <a-space>
          <a-button
            @click="switchToTableView"
            :type="viewMode === 'table' ? 'primary' : 'default'"
            size="small"
          >
            <template #icon><TableOutlined /></template>
            表格视图
          </a-button>
          <a-button
            @click="switchToJsonView"
            :type="viewMode === 'json' ? 'primary' : 'default'"
            size="small"
          >
            <template #icon><CodeOutlined /></template>
            JSON 编辑
          </a-button>
        </a-space>
      </template>

      <!-- 表格视图 -->
      <div v-if="viewMode === 'table'" class="table-view">
        <div class="mcp-header">
          <a-space>
            <a-button @click="emit('update')" :loading="props.loading.mcp">
              <template #icon><ReloadOutlined /></template>
              刷新服务器
            </a-button>
            <a-button type="primary" @click="emit('update')">
              <template #icon><PlusOutlined /></template>
              添加服务器
            </a-button>
            <a-button @click="shareCurrentConfig">
              <template #icon><ShareAltOutlined /></template>
              分享配置
            </a-button>
            <a-button @click="showAddByShareModal = true">
              <template #icon><DownloadOutlined /></template>
              导入分享
            </a-button>
          </a-space>
        </div>

        <div class="mcp-list">
          <a-table
            :dataSource="props.servers"
            :columns="mcpColumns"
            :pagination="false"
            size="small"
            :scroll="{ x: 'max-content', y: 400 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'command'">
                <a-typography-text code>
                  {{ record.command }}
                </a-typography-text>
              </template>
              <template v-else-if="column.key === 'args'">
                <a-tag v-for="arg in record.args" :key="arg" size="small">
                  {{ arg }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'env'">
                <a-tag
                  v-for="(value, key) in record.env"
                  :key="key"
                  size="small"
                >
                  {{ key }}={{ value }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <a-button
                    size="small"
                    danger
                    @click="emit('removeServer', record.name)"
                  >
                    删除
                  </a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </div>
      </div>

      <!-- JSON 编辑视图 -->
      <div v-else class="json-view">
        <div class="json-header">
          <a-space>
            <a-button @click="loadJsonConfig" :loading="jsonLoading">
              <template #icon><ReloadOutlined /></template>
              刷新配置
            </a-button>
            <a-button
              type="primary"
              @click="saveJsonConfig"
              :loading="jsonLoading"
              :disabled="!isJsonValid"
            >
              <template #icon><SaveOutlined /></template>
              保存配置
            </a-button>
            <a-button @click="formatJson">
              <template #icon><FormatPainterOutlined /></template>
              格式化
            </a-button>
            <a-button @click="shareCurrentConfig">
              <template #icon><ShareAltOutlined /></template>
              分享配置
            </a-button>
            <a-button @click="showAddByShareModal = true">
              <template #icon><DownloadOutlined /></template>
              导入分享
            </a-button>
          </a-space>
        </div>

        <div class="json-editor">
          <a-textarea
            v-model:value="jsonConfig"
            :rows="20"
            placeholder="请输入 MCP 配置的 JSON..."
            class="json-textarea"
            @change="validateJson"
          />
          <div v-if="jsonError" class="json-error">
            <a-alert :message="jsonError" type="error" show-icon closable />
          </div>
        </div>
      </div>
    </a-card>

    <!-- 分享成功模态框 -->
    <a-modal
      v-model:open="showShareSuccessModal"
      title="分享成功"
      :footer="null"
    >
      <div class="share-success">
        <a-result
          status="success"
          title="配置分享成功！"
          :sub-title="shareResult ? `分享ID: ${shareResult.shareId}` : ''"
        >
          <template #extra>
            <a-space direction="vertical" style="width: 100%">
              <a-input
                :value="shareResult?.shareId || ''"
                readonly
                v-if="shareResult"
              >
                <template #suffix>
                  <a-button
                    type="link"
                    size="small"
                    @click="copyShareId(shareResult.shareId)"
                    v-if="shareResult"
                  >
                    复制
                  </a-button>
                </template>
              </a-input>
              <a-typography-text type="secondary">
                其他用户可以使用这个ID导入您的配置
              </a-typography-text>
            </a-space>
          </template>
        </a-result>
      </div>
    </a-modal>

    <!-- 通过分享ID添加配置模态框 -->
    <a-modal
      v-model:open="showAddByShareModal"
      title="导入分享配置"
      @ok="addByShareId"
      :confirm-loading="addByShareLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="分享ID" required>
          <a-input
            v-model:value="addByShareForm.shareId"
            placeholder="请输入分享ID..."
          />
        </a-form-item>
        <a-form-item v-if="previewConfig" label="配置预览">
          <div class="config-preview">
            <a-descriptions title="配置信息" size="small" bordered>
              <a-descriptions-item label="创建者" :span="3">
                {{ previewConfig.creatorEmail }}
              </a-descriptions-item>
              <a-descriptions-item label="使用次数" :span="3">
                {{ previewConfig.usageCount }}
              </a-descriptions-item>
            </a-descriptions>
            <div class="config-items">
              <h4>包含的 MCP 服务器：</h4>
              <a-tag
                v-for="(config, name) in previewConfig.mcpConfig"
                :key="name"
                color="blue"
              >
                {{ name }}
              </a-tag>
            </div>
          </div>
        </a-form-item>
      </a-form>
      <template #footer>
        <a-space>
          <a-button @click="showAddByShareModal = false">取消</a-button>
          <a-button @click="previewShareConfig" :loading="previewLoading">
            预览配置
          </a-button>
          <a-button
            type="primary"
            @click="addByShareId"
            :loading="addByShareLoading"
            :disabled="!previewConfig"
          >
            导入配置
          </a-button>
        </a-space>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import {
  CodeOutlined,
  DownloadOutlined,
  FormatPainterOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  ShareAltOutlined,
  TableOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { computed, ref } from "vue";

import {
  mcpApi,
  type McpServerItem,
  type SharedMcpConfig,
} from "../../../api/mcp";
import { sendTaskToVscode } from "../../../utils/vscodeUtils";

interface Props {
  servers: McpServerItem[];
  loading?: {
    mcp: boolean;
  };
}

const props = withDefaults(defineProps<Props>(), {
  loading: () => ({ mcp: false }),
});

const emit = defineEmits<{
  (e: "update"): void;
  (e: "removeServer", name: string): void;
}>();

// 视图模式
const viewMode = ref<"table" | "json">("table");

// JSON 编辑相关
const jsonConfig = ref<string>("");
const jsonLoading = ref(false);
const jsonError = ref<string>("");

// 分享相关状态
const shareLoading = ref(false);
const shareResult = ref<{ shareId: string } | null>(null);
const showShareSuccessModal = ref(false);

// 预览分享配置相关状态
const previewConfig = ref<SharedMcpConfig | null>(null);
const previewLoading = ref(false);

// 添加配置相关状态
const addByShareLoading = ref(false);
const showAddByShareModal = ref(false);
const addByShareForm = ref({
  shareId: "",
});

// 表格列配置
const mcpColumns = [
  {
    title: "服务器名称",
    dataIndex: "name",
    key: "name",
    width: 150,
  },
  {
    title: "命令",
    dataIndex: "command",
    key: "command",
    width: 200,
  },
  {
    title: "参数",
    dataIndex: "args",
    key: "args",
    width: 200,
  },
  {
    title: "环境变量",
    dataIndex: "env",
    key: "env",
    width: 200,
  },
  {
    title: "操作",
    key: "actions",
    width: 100,
    fixed: "right" as const,
  },
];

// 计算属性
const isJsonValid = computed(() => {
  return !jsonError.value && jsonConfig.value && jsonConfig.value.trim() !== "";
});

// 切换视图
const switchToTableView = () => {
  viewMode.value = "table";
};

const switchToJsonView = () => {
  viewMode.value = "json";
  loadJsonConfig();
};

// 加载JSON配置 - 直接从VS Code获取
const loadJsonConfig = async () => {
  jsonLoading.value = true;
  jsonError.value = "";

  try {
    // sendTaskToVscode 在成功时直接返回数据，失败时抛出错误
    const result = await sendTaskToVscode("cursor:getMcpConfigJson", {});

    console.log("loadJsonConfig 收到结果:", result);

    if (result && result.mcpConfig) {
      jsonConfig.value = JSON.stringify(result.mcpConfig, null, 2);
      message.success("JSON 配置加载成功");
    } else {
      // 如果没有配置数据，显示空对象
      jsonConfig.value = JSON.stringify({}, null, 2);
      message.success("JSON 配置加载成功（空配置）");
    }
  } catch (error) {
    console.error("加载 JSON 配置失败:", error);
    const errorMessage = error instanceof Error ? error.message : "加载失败";
    jsonError.value = errorMessage;
    message.error("加载 JSON 配置失败: " + errorMessage);

    // 设置默认的空配置
    jsonConfig.value = JSON.stringify({}, null, 2);
  } finally {
    jsonLoading.value = false;
  }
};

// 验证JSON
const validateJson = (): boolean => {
  if (!jsonConfig.value) {
    jsonError.value = "JSON 配置为空";
    return false;
  }

  try {
    JSON.parse(jsonConfig.value);
    jsonError.value = "";
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "JSON 格式错误";
    jsonError.value = "JSON 格式错误: " + errorMessage;
    return false;
  }
};

// 格式化JSON
const formatJson = () => {
  if (validateJson()) {
    try {
      const parsed = JSON.parse(jsonConfig.value);
      jsonConfig.value = JSON.stringify(parsed, null, 2);
      message.success("JSON 格式化成功");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "格式化失败";
      message.error("格式化失败: " + errorMessage);
    }
  }
};

// 保存JSON配置 - 直接保存到VS Code
const saveJsonConfig = async () => {
  if (!validateJson()) {
    message.error("请先修复 JSON 格式错误");
    return;
  }

  jsonLoading.value = true;

  try {
    const mcpConfig = JSON.parse(jsonConfig.value);
    // sendTaskToVscode 在成功时直接返回数据，失败时抛出错误
    const result = await sendTaskToVscode("cursor:batchUpdateMcpConfig", {
      mcpConfig,
    });

    console.log("saveJsonConfig 收到结果:", result);

    if (result) {
      message.success(`配置保存成功，更新了 ${result.count || 0} 个配置项`);
      // 触发父组件刷新
      emit("update");
    } else {
      message.success("配置保存成功");
      emit("update");
    }
  } catch (error) {
    console.error("保存 JSON 配置失败:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    message.error("保存失败: " + errorMessage);
  } finally {
    jsonLoading.value = false;
  }
};

// 分享当前配置 - 调用服务端API
const shareCurrentConfig = async () => {
  shareLoading.value = true;

  try {
    let mcpConfig: Record<string, McpServerItem>;

    // 如果在JSON视图且有有效配置，使用JSON配置
    if (
      viewMode.value === "json" &&
      jsonConfig.value &&
      jsonConfig.value.trim()
    ) {
      if (!validateJson()) {
        message.error("JSON 格式错误，无法分享");
        shareLoading.value = false;
        return;
      }
      mcpConfig = JSON.parse(jsonConfig.value);
    } else {
      // 否则从当前服务器列表构建配置
      mcpConfig = {};
      props.servers.forEach((server) => {
        mcpConfig[server.name] = {
          name: server.name,
          command: server.command,
          args: server.args || [],
          env: server.env || {},
          description: server.description,
          enabled: server.enabled,
        };
      });
    }

    // 检查是否有配置可分享
    if (!mcpConfig || Object.keys(mcpConfig).length === 0) {
      message.error("没有可分享的MCP配置");
      shareLoading.value = false;
      return;
    }

    console.log("准备分享的配置:", mcpConfig);

    const response = await mcpApi.shareMcpConfig(
      "MCP配置分享",
      "用户分享的MCP配置",
      mcpConfig,
    );

    console.log("分享响应:", response);

    if (response && response.shareId) {
      shareResult.value = { shareId: response.shareId };
      showShareSuccessModal.value = true;
      message.success("配置分享成功！");
    } else {
      message.error("分享失败: " + (response?.message || "未知错误"));
    }
  } catch (error) {
    console.error("分享配置失败:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    message.error("分享失败: " + errorMessage);
  } finally {
    shareLoading.value = false;
  }
};

// 预览分享配置 - 调用服务端API
const previewShareConfig = async () => {
  if (!addByShareForm.value.shareId.trim()) {
    message.error("请输入分享ID");
    return;
  }

  previewLoading.value = true;

  try {
    const response = await mcpApi.getMcpConfigByShareId(
      addByShareForm.value.shareId,
    );

    if (response.success && response.data) {
      previewConfig.value = response.data;
      message.success("配置预览加载成功");
    } else {
      message.error("获取分享配置失败: " + (response.message || "未知错误"));
    }
  } catch (error) {
    console.error("预览分享配置失败:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    message.error("预览失败: " + errorMessage);
  } finally {
    previewLoading.value = false;
  }
};

// 通过分享ID添加配置 - 调用服务端API获取，然后通过VS Code保存
const addByShareId = async () => {
  if (!addByShareForm.value.shareId.trim()) {
    message.error("请输入分享ID");
    return;
  }

  addByShareLoading.value = true;

  try {
    // 先从服务端获取分享的配置
    const shareResponse = await mcpApi.getMcpConfigByShareId(
      addByShareForm.value.shareId,
    );

    if (!shareResponse.success || !shareResponse.data) {
      throw new Error(shareResponse.message || "获取分享配置失败");
    }

    // 获取当前本地配置
    const currentResult = await sendTaskToVscode("cursor:getMcpConfigJson", {});
    // sendTaskToVscode 成功时返回数据，失败时抛出异常
    console.log("获取当前配置结果:", currentResult);

    // 合并配置（分享的配置不会覆盖现有的同名配置）
    const currentConfig = currentResult?.mcpConfig || {};
    const sharedConfig = shareResponse.data.mcpConfig;
    const mergedConfig = { ...currentConfig };

    let addedCount = 0;
    for (const [name, config] of Object.entries(sharedConfig)) {
      if (!mergedConfig[name]) {
        mergedConfig[name] = config;
        addedCount++;
      }
    }

    if (addedCount === 0) {
      message.warning("没有新的配置需要添加（所有配置已存在）");
      return;
    }

    // 保存合并后的配置到VS Code
    const saveResult = await sendTaskToVscode("cursor:batchUpdateMcpConfig", {
      mcpConfig: mergedConfig,
    });

    // sendTaskToVscode 成功时返回数据，失败时抛出异常
    console.log("保存配置结果:", saveResult);
    message.success(`成功添加 ${addedCount} 个配置项`);
    showAddByShareModal.value = false;
    addByShareForm.value = { shareId: "" };
    previewConfig.value = null;
    // 触发父组件刷新
    await loadJsonConfig(); // 重新加载配置
    emit("update");
  } catch (error) {
    console.error("通过分享 ID 添加配置失败:", error);
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    message.error("添加失败: " + errorMessage);
  } finally {
    addByShareLoading.value = false;
  }
};

// 复制分享ID
const copyShareId = async (shareId: string) => {
  try {
    await navigator.clipboard.writeText(shareId);
    message.success("分享 ID 已复制到剪贴板");
  } catch (error) {
    console.error("复制失败:", error);
    message.error("复制失败，请手动复制");
  }
};
</script>

<style scoped>
.mcp-management {
  width: 100%;
}

.section-card {
  margin-bottom: 16px;
}

.mcp-header,
.json-header {
  margin-bottom: 16px;
}

.mcp-list {
  width: 100%;
}

.json-view {
  width: 100%;
}

.json-editor {
  width: 100%;
}

.json-textarea {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 12px;
  line-height: 1.4;
}

.json-error {
  margin-top: 8px;
}

.share-success {
  text-align: center;
}

.config-preview {
  margin-top: 16px;
}

.config-items {
  margin-top: 16px;
}

.config-items h4 {
  margin-bottom: 8px;
  color: #666;
}
</style>
