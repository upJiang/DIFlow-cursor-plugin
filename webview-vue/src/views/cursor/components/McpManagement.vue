<template>
  <div class="mcp-management">
    <a-card title="MCP 服务器管理" size="small" class="section-card">
      <div class="mcp-section">
        <a-space direction="vertical" style="width: 100%">
          <div class="mcp-header">
            <a-space>
              <a-button
                @click="$emit('loadServers')"
                :loading="props.loading.mcp"
              >
                <template #icon><ReloadOutlined /></template>
                刷新服务器
              </a-button>
              <a-button type="primary" @click="$emit('showAddModal')">
                <template #icon><PlusOutlined /></template>
                添加服务器
              </a-button>
            </a-space>
          </div>

          <div class="mcp-list">
            <a-table
              :dataSource="props.mcpServers"
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
                      @click="$emit('removeServer', record.name)"
                    >
                      删除
                    </a-button>
                  </a-space>
                </template>
              </template>
            </a-table>
          </div>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons-vue";

interface McpServer {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

interface Props {
  mcpServers: McpServer[];
  loading: {
    mcp: boolean;
  };
}

const props = withDefaults(defineProps<Props>(), {
  mcpServers: () => [],
  loading: () => ({
    mcp: false,
  }),
});

defineEmits<{
  loadServers: [];
  showAddModal: [];
  removeServer: [name: string];
}>();

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
</script>

<style scoped>
.mcp-management {
  width: 100%;
}

.section-card {
  margin-bottom: 16px;
}

.mcp-section {
  width: 100%;
}

.mcp-header {
  margin-bottom: 16px;
}

.mcp-list {
  width: 100%;
}
</style>
