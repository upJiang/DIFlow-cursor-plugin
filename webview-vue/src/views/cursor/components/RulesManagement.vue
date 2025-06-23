<template>
  <div class="rules-management">
    <a-card title="Cursor 规则管理" size="small" class="section-card">
      <div class="rules-section">
        <a-space direction="vertical" style="width: 100%" :size="16">
          <!-- 操作按钮 -->
          <div class="rules-header">
            <a-space>
              <a-button @click="loadAllRules" :loading="props.loading.load">
                <template #icon><ReloadOutlined /></template>
                刷新所有规则
              </a-button>
              <a-button
                type="primary"
                @click="$emit('saveRules')"
                :loading="props.loading.save"
              >
                <template #icon><SaveOutlined /></template>
                保存 .cursorrules
              </a-button>
              <a-button
                danger
                @click="$emit('clearRules')"
                :loading="props.loading.clear"
              >
                <template #icon><DeleteOutlined /></template>
                清空 .cursorrules
              </a-button>
            </a-space>
          </div>

          <!-- 规则类型标签页 -->
          <a-tabs v-model:activeKey="activeTab" type="card">
            <!-- .cursorrules 文件 -->
            <a-tab-pane key="cursorrules" tab=".cursorrules 文件">
              <div class="rules-editor">
                <a-textarea
                  :value="props.cursorRules"
                  @update:value="$emit('update:cursorRules', $event)"
                  placeholder="在此编辑 .cursorrules 文件内容..."
                  :rows="15"
                  show-count
                  :maxlength="10000"
                />
                <div class="rules-help">
                  <a-alert
                    message="提示"
                    description="这是项目根目录的 .cursorrules 文件，用于定义项目特定的编码规则。这些规则只在当前项目中生效。"
                    type="info"
                    show-icon
                    closable
                  />
                </div>
                <!-- 预览区域 -->
                <div v-if="props.cursorRules" class="rules-preview">
                  <a-divider>预览</a-divider>
                  <MarkdownRenderer
                    :content="props.cursorRules"
                    title=".cursorrules 预览"
                    :show-header="true"
                  />
                </div>
              </div>
            </a-tab-pane>

            <!-- 项目 .cursor/rules/ 目录 -->
            <a-tab-pane key="project" tab="项目规则文件">
              <div class="project-rules">
                <div v-if="projectRules.length === 0" class="empty-state">
                  <a-empty
                    description="项目中没有找到 .cursor/rules/ 目录或规则文件"
                  >
                    <template #image>
                      <FileTextOutlined
                        style="font-size: 48px; color: #d9d9d9"
                      />
                    </template>
                  </a-empty>
                </div>
                <div v-else>
                  <a-space direction="vertical" style="width: 100%" :size="12">
                    <div
                      v-for="rule in projectRules"
                      :key="rule.name"
                      class="rule-item"
                    >
                      <a-card size="small" :title="rule.name + '.mdc'">
                        <template #extra>
                          <a-space>
                            <a-tag
                              v-if="rule.metadata?.alwaysApply"
                              color="green"
                            >
                              总是应用
                            </a-tag>
                            <a-tag
                              v-if="rule.metadata?.description"
                              color="blue"
                            >
                              {{ rule.metadata.description }}
                            </a-tag>
                          </a-space>
                        </template>
                        <MarkdownRenderer
                          :content="rule.content"
                          :title="rule.name + '.mdc'"
                          :show-header="true"
                        />
                        <div class="rule-path">
                          <a-typography-text
                            type="secondary"
                            style="font-size: 12px"
                          >
                            {{ rule.path }}
                          </a-typography-text>
                        </div>
                      </a-card>
                    </div>
                  </a-space>
                </div>
              </div>
            </a-tab-pane>

            <!-- Cursor Settings 用户规则 -->
            <a-tab-pane key="settings" tab="Cursor 设置规则">
              <div class="settings-rules">
                <div v-if="!cursorUserRule" class="empty-state">
                  <a-empty
                    description="Cursor settings.json 中没有找到用户规则配置"
                  >
                    <template #image>
                      <SettingOutlined
                        style="font-size: 48px; color: #d9d9d9"
                      />
                    </template>
                  </a-empty>
                </div>
                <div v-else>
                  <a-card size="small" title="Cursor 用户规则">
                    <MarkdownRenderer
                      :content="cursorUserRule"
                      title="Cursor 用户规则"
                      :show-header="true"
                    />
                    <div class="rules-help" style="margin-top: 12px">
                      <a-alert
                        message="说明"
                        description="这是 Cursor settings.json 中配置的用户规则，会在所有项目中全局生效。"
                        type="warning"
                        show-icon
                        closable
                      />
                    </div>
                  </a-card>
                </div>
              </div>
            </a-tab-pane>

            <!-- 规则统计 -->
            <a-tab-pane key="stats" tab="规则统计">
              <div class="rules-stats">
                <a-row :gutter="16">
                  <a-col :span="8">
                    <a-statistic
                      title=".cursorrules 文件"
                      :value="props.cursorRules ? 1 : 0"
                      suffix="个"
                    >
                      <template #prefix>
                        <FileTextOutlined />
                      </template>
                    </a-statistic>
                  </a-col>
                  <a-col :span="8">
                    <a-statistic
                      title="项目规则文件"
                      :value="projectRules.length"
                      suffix="个"
                    >
                      <template #prefix>
                        <FolderOutlined />
                      </template>
                    </a-statistic>
                  </a-col>
                  <a-col :span="8">
                    <a-statistic
                      title="Cursor 设置规则"
                      :value="cursorUserRule ? 1 : 0"
                      suffix="个"
                    >
                      <template #prefix>
                        <SettingOutlined />
                      </template>
                    </a-statistic>
                  </a-col>
                </a-row>

                <a-divider />

                <div class="rules-summary">
                  <h4>规则优先级说明</h4>
                  <ol>
                    <li>
                      <strong>项目规则文件</strong>
                      ：.cursor/rules/ 目录下的 .mdc 文件，项目特定规则
                    </li>
                    <li>
                      <strong>.cursorrules 文件</strong>
                      ：项目根目录的规则文件，项目级别规则
                    </li>
                    <li>
                      <strong>Cursor 设置规则</strong>
                      ：全局用户规则，在所有项目中生效
                    </li>
                  </ol>
                </div>
              </div>
            </a-tab-pane>
          </a-tabs>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import {
  DeleteOutlined,
  FileTextOutlined,
  FolderOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { onMounted, ref } from "vue";

import MarkdownRenderer from "../../../components/MarkdownRenderer.vue";
import { sendTaskToVscode } from "../../../utils/vscodeUtils";

interface ProjectRule {
  name: string;
  path: string;
  content: string;
  metadata?: {
    description?: string;
    globs?: string;
    alwaysApply?: boolean;
  };
}

interface Props {
  cursorRules: string;
  loading: {
    load: boolean;
    save: boolean;
    clear: boolean;
  };
}

const props = withDefaults(defineProps<Props>(), {
  cursorRules: "",
  loading: () => ({
    load: false,
    save: false,
    clear: false,
  }),
});

const emit = defineEmits<{
  loadRules: [];
  saveRules: [];
  clearRules: [];
  "update:cursorRules": [value: string];
}>();

// 响应式数据
const activeTab = ref("cursorrules");
const projectRules = ref<ProjectRule[]>([]);
const cursorUserRule = ref<string>("");
const internalLoading = ref(false);

// 加载所有规则
const loadAllRules = async () => {
  internalLoading.value = true;
  try {
    console.log("开始加载所有规则...");

    // 加载 .cursorrules 文件
    emit("loadRules");

    // 并行加载项目规则和 Cursor 设置规则
    const [projectResult, settingsResult] = await Promise.all([
      sendTaskToVscode("getProjectCursorRules"),
      sendTaskToVscode("getCursorSettingsUserRule"),
    ]);

    console.log("项目规则结果:", projectResult);
    console.log("设置规则结果:", settingsResult);

    // 处理项目规则
    if (projectResult && projectResult.rules) {
      projectRules.value = projectResult.rules || [];
      console.log(`加载了 ${projectRules.value.length} 个项目规则文件`);
    } else {
      projectRules.value = [];
      console.warn("加载项目规则失败:", "未找到规则数据");
    }

    // 处理 Cursor 设置规则
    if (settingsResult && settingsResult.userRule !== undefined) {
      cursorUserRule.value = settingsResult.userRule || "";
      console.log(
        "Cursor 用户规则:",
        cursorUserRule.value ? "已找到" : "未找到",
      );
    } else {
      cursorUserRule.value = "";
      console.warn("加载 Cursor 设置规则失败:", "未找到用户规则数据");
    }

    message.success("规则加载完成");
  } catch (error) {
    console.error("加载规则失败:", error);
    message.error(`加载规则失败: ${error}`);
  } finally {
    internalLoading.value = false;
  }
};

// 组件挂载时自动加载
onMounted(() => {
  loadAllRules();
});
</script>

<style scoped>
.rules-management {
  width: 100%;
}

.section-card {
  margin-bottom: 16px;
}

.rules-section {
  width: 100%;
}

.rules-header {
  margin-bottom: 16px;
}

.rules-editor {
  width: 100%;
}

.rules-preview {
  margin-top: 16px;
}

.rules-help {
  margin-top: 16px;
}

.project-rules {
  width: 100%;
}

.rule-item {
  width: 100%;
}

.rule-path {
  margin-top: 8px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.settings-rules {
  width: 100%;
}

.rules-stats {
  width: 100%;
}

.rules-summary {
  margin-top: 16px;
}

.rules-summary h4 {
  margin-bottom: 12px;
  color: #1890ff;
}

.rules-summary ol {
  padding-left: 20px;
}

.rules-summary li {
  margin-bottom: 8px;
  line-height: 1.5;
}
</style>
