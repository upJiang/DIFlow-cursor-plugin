<template>
  <div class="rules-management">
    <a-card title="Cursor 规则管理" size="small" class="section-card">
      <div class="rules-section">
        <a-space direction="vertical" style="width: 100%">
          <div class="rules-header">
            <a-space>
              <a-button
                @click="$emit('loadRules')"
                :loading="props.loading.load"
              >
                <template #icon><ReloadOutlined /></template>
                刷新规则
              </a-button>
              <a-button
                type="primary"
                @click="$emit('saveRules')"
                :loading="props.loading.save"
              >
                <template #icon><SaveOutlined /></template>
                保存规则
              </a-button>
              <a-button
                danger
                @click="$emit('clearRules')"
                :loading="props.loading.clear"
              >
                <template #icon><DeleteOutlined /></template>
                清空规则
              </a-button>
            </a-space>
          </div>

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
                description="这里编辑的是 Cursor settings.json 中的用户规则配置，用于定义全局的编码规则和约定。这些规则会在 Cursor 的所有项目中生效。"
                type="info"
                show-icon
                closable
              />
            </div>
          </div>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import {
  DeleteOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons-vue";
import { withDefaults } from "vue";

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

defineEmits<{
  loadRules: [];
  saveRules: [];
  clearRules: [];
  "update:cursorRules": [value: string];
}>();
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

.rules-help {
  margin-top: 16px;
}
</style>
