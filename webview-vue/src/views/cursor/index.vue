<template>
  <div class="cursor-management">
    <div class="background-decoration"></div>
    <a-card title="Cursor 集成管理" class="main-card">
      <a-tabs v-model:activeKey="activeTab" type="card">
        <!-- 基本信息 Tab -->
        <a-tab-pane key="basic" tab="基本信息">
          <div class="tab-content">
            <!-- 状态检查区域 -->
            <a-card title="状态检查" size="small" class="section-card">
              <div class="status-section">
                <a-space direction="vertical" style="width: 100%">
                  <div class="status-item">
                    <a-space>
                      <a-badge
                        :status="cursorStatus.installed ? 'success' : 'error'"
                      />
                      <span>
                        Cursor 安装状态:
                        {{ cursorStatus.installed ? "已安装" : "未安装" }}
                      </span>
                      <a-button
                        size="small"
                        @click="checkCursorStatus"
                        :loading="loading.status"
                      >
                        刷新状态
                      </a-button>
                      <a-button
                        v-if="!cursorStatus.installed"
                        size="small"
                        type="primary"
                        @click="showCustomPathModal"
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
          </div>
        </a-tab-pane>

        <!-- 规则管理 Tab -->
        <a-tab-pane key="rules" tab="规则管理">
          <div class="tab-content">
            <a-card title="Cursor 规则管理" size="small" class="section-card">
              <div class="rules-section">
                <a-space direction="vertical" style="width: 100%">
                  <div class="rules-header">
                    <a-space>
                      <a-button @click="loadSettings" :loading="loading.load">
                        <template #icon><ReloadOutlined /></template>
                        刷新规则
                      </a-button>
                      <a-button
                        type="primary"
                        @click="saveCursorRules"
                        :loading="loading.save"
                      >
                        <template #icon><SaveOutlined /></template>
                        保存规则
                      </a-button>
                      <a-button
                        danger
                        @click="clearCursorRules"
                        :loading="loading.clear"
                      >
                        <template #icon><DeleteOutlined /></template>
                        清空规则
                      </a-button>
                    </a-space>
                  </div>

                  <div class="rules-editor">
                    <a-textarea
                      v-model:value="cursorRules"
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
        </a-tab-pane>

        <!-- MCP 管理 Tab -->
        <a-tab-pane key="mcp" tab="MCP 管理">
          <div class="tab-content">
            <a-card title="MCP 服务器管理" size="small" class="section-card">
              <div class="mcp-section">
                <a-space direction="vertical" style="width: 100%">
                  <div class="mcp-header">
                    <a-space>
                      <a-button @click="loadMcpServers" :loading="loading.mcp">
                        <template #icon><ReloadOutlined /></template>
                        刷新服务器
                      </a-button>
                      <a-button type="primary" @click="showAddMcpModal">
                        <template #icon><PlusOutlined /></template>
                        添加服务器
                      </a-button>
                    </a-space>
                  </div>

                  <div class="mcp-list">
                    <a-table
                      :dataSource="mcpServers"
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
                          <a-tag
                            v-for="arg in record.args"
                            :key="arg"
                            size="small"
                          >
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
                              @click="removeMcpServer(record.name)"
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
        </a-tab-pane>

        <!-- 快速聊天 Tab -->
        <a-tab-pane key="chat" tab="快速聊天">
          <div class="tab-content">
            <a-card title="Cursor Chat 集成" size="small" class="section-card">
              <div class="chat-section">
                <a-space direction="vertical" style="width: 100%">
                  <div class="chat-input">
                    <a-textarea
                      v-model:value="chatMessage"
                      placeholder="输入要发送到 Cursor Chat 的消息..."
                      :rows="8"
                      show-count
                      :maxlength="2000"
                    />
                  </div>

                  <div class="chat-actions">
                    <a-space>
                      <a-button
                        type="primary"
                        @click="sendToCursorChat"
                        :loading="loading.chat"
                      >
                        <template #icon><MessageOutlined /></template>
                        发送到 Chat
                      </a-button>
                      <a-button
                        @click="openCursorChat"
                        :loading="loading.openChat"
                      >
                        <template #icon><CommentOutlined /></template>
                        打开 Chat
                      </a-button>
                      <a-button
                        @click="openCursor"
                        :loading="loading.openCursor"
                      >
                        <template #icon><AppstoreOutlined /></template>
                        打开 Cursor
                      </a-button>
                    </a-space>
                  </div>

                  <div class="chat-help">
                    <a-alert
                      message="聊天功能说明"
                      description="点击'发送到 Chat'会尝试自动打开 Cursor 聊天界面并发送消息。如果自动发送失败，消息会被复制到剪贴板，您可以手动粘贴到聊天界面。"
                      type="info"
                      show-icon
                      closable
                    />
                  </div>
                </a-space>
              </div>
            </a-card>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- 添加 MCP 服务器模态框 -->
    <a-modal
      v-model:open="mcpModalVisible"
      title="添加 MCP 服务器"
      @ok="addMcpServer"
      @cancel="cancelAddMcp"
      :confirmLoading="loading.addMcp"
    >
      <a-form :model="newMcpServer" layout="vertical">
        <a-form-item label="服务器名称" required>
          <a-input
            v-model:value="newMcpServer.name"
            placeholder="例如: filesystem"
          />
        </a-form-item>

        <a-form-item label="连接类型" required>
          <a-radio-group v-model:value="newMcpServer.type">
            <a-radio value="command">命令行</a-radio>
            <a-radio value="url">URL</a-radio>
          </a-radio-group>
        </a-form-item>

        <template v-if="newMcpServer.type === 'command'">
          <a-form-item label="命令" required>
            <a-input
              v-model:value="newMcpServer.command"
              placeholder="例如: npx"
            />
          </a-form-item>

          <a-form-item label="参数">
            <a-textarea
              v-model:value="newMcpServer.argsText"
              placeholder="每行一个参数，例如:&#10;-y&#10;@modelcontextprotocol/server-filesystem&#10;/path/to/directory"
              :rows="4"
            />
          </a-form-item>
        </template>

        <template v-else>
          <a-form-item label="服务器 URL" required>
            <a-input
              v-model:value="newMcpServer.url"
              placeholder="例如: http://localhost:3000"
            />
          </a-form-item>
        </template>

        <a-form-item label="环境变量">
          <a-textarea
            v-model:value="newMcpServer.envText"
            placeholder="每行一个环境变量，格式: KEY=VALUE&#10;例如:&#10;API_KEY=your-key-here&#10;DEBUG=true"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 自定义安装路径模态框 -->
    <a-modal
      v-model:open="customPathModalVisible"
      title="设置 Cursor 安装路径"
      @ok="setCustomInstallPath"
      @cancel="cancelCustomPath"
      :confirmLoading="loading.customPath"
      width="800px"
    >
      <a-space direction="vertical" style="width: 100%">
        <a-alert
          message="找不到 Cursor 安装路径？"
          description="请根据您的操作系统，按照下面的指导找到 Cursor 的安装路径。"
          type="info"
          show-icon
        />

        <a-collapse>
          <a-collapse-panel key="macos" header="🍎 macOS 用户">
            <div class="guide-content">
              <h4>常见安装路径：</h4>
              <ul>
                <li><code>/Applications/Cursor.app</code></li>
                <li><code>~/Applications/Cursor.app</code></li>
              </ul>

              <h4>如何找到安装路径：</h4>
              <ol>
                <li>在 Finder 中找到 Cursor 应用</li>
                <li>右键点击 Cursor 应用，选择"显示简介"</li>
                <li>在"位置"一栏中可以看到完整路径</li>
                <li>
                  或者在终端中运行：
                  <code>mdfind "kMDItemDisplayName == 'Cursor'"</code>
                </li>
              </ol>
            </div>
          </a-collapse-panel>

          <a-collapse-panel key="windows" header="🪟 Windows 用户">
            <div class="guide-content">
              <h4>常见安装路径：</h4>
              <ul>
                <li>
                  <code>C:\Users\[用户名]\AppData\Local\Programs\cursor</code>
                </li>
                <li><code>C:\Program Files\Cursor</code></li>
                <li><code>C:\Program Files (x86)\Cursor</code></li>
              </ul>

              <h4>如何找到安装路径：</h4>
              <ol>
                <li>右键点击桌面上的 Cursor 图标</li>
                <li>选择"属性"</li>
                <li>在"目标"或"起始位置"中可以看到安装路径</li>
                <li>
                  或者在命令提示符中运行：
                  <code>where cursor</code>
                </li>
              </ol>
            </div>
          </a-collapse-panel>

          <a-collapse-panel key="linux" header="🐧 Linux 用户">
            <div class="guide-content">
              <h4>常见安装路径：</h4>
              <ul>
                <li><code>/opt/cursor</code></li>
                <li><code>~/.local/bin/cursor</code></li>
                <li><code>/usr/local/bin/cursor</code></li>
              </ul>

              <h4>如何找到安装路径：</h4>
              <ol>
                <li>
                  在终端中运行：
                  <code>which cursor</code>
                </li>
                <li>
                  或者运行：
                  <code>whereis cursor</code>
                </li>
                <li>如果是 AppImage，查看下载目录</li>
              </ol>
            </div>
          </a-collapse-panel>
        </a-collapse>

        <a-divider />

        <a-form layout="vertical">
          <a-form-item label="Cursor 安装路径" required>
            <a-input
              v-model:value="customInstallPath"
              placeholder="请输入 Cursor 的完整安装路径..."
              size="large"
            />
            <div class="path-tips">
              <a-typography-text type="secondary">
                💡 提示：如果不确定是否安装了 Cursor，可以在终端中运行
                <code>cursor --version</code>
                来验证
              </a-typography-text>
            </div>
          </a-form-item>
        </a-form>
      </a-space>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import {
  AppstoreOutlined,
  CommentOutlined,
  DeleteOutlined,
  MessageOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import { onMounted, reactive, ref } from "vue";

import { sendTaskToVscode } from "../../utils/vscodeUtils";

// 类型定义
interface McpServerConfig {
  name: string;
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  key: string;
}

interface NewMcpServerForm {
  name: string;
  type: "command" | "url";
  command: string;
  url: string;
  argsText: string;
  envText: string;
}

// 响应式数据
const activeTab = ref("basic");
const cursorRules = ref("");
const chatMessage = ref("");
const mcpServers = ref<McpServerConfig[]>([]);
const mcpModalVisible = ref(false);
const customPathModalVisible = ref(false);
const customInstallPath = ref("");

const cursorStatus = reactive({
  installed: false,
});

const systemInfo = reactive({
  platform: "",
  configPath: "",
  mcpPath: "",
  rulesPath: "",
  cliPath: "",
});

const loading = reactive({
  status: false,
  load: false,
  save: false,
  clear: false,
  mcp: false,
  chat: false,
  openChat: false,
  openCursor: false,
  addMcp: false,
  customPath: false,
});

const newMcpServer = reactive<NewMcpServerForm>({
  name: "",
  type: "command",
  command: "",
  url: "",
  argsText: "",
  envText: "",
});

// MCP 表格列定义
const mcpColumns = [
  {
    title: "名称",
    dataIndex: "name",
    key: "name",
    width: 120,
    fixed: "left",
    ellipsis: true,
  },
  {
    title: "命令",
    dataIndex: "command",
    key: "command",
    width: 150,
    ellipsis: true,
  },
  {
    title: "参数",
    dataIndex: "args",
    key: "args",
    width: 200,
    ellipsis: true,
  },
  {
    title: "环境变量",
    dataIndex: "env",
    key: "env",
    width: 180,
    ellipsis: true,
  },
  {
    title: "操作",
    key: "actions",
    width: 100,
    fixed: "right",
  },
];

// 获取平台名称
const getPlatformName = (platform: string): string => {
  switch (platform) {
    case "win32":
      return "Windows";
    case "darwin":
      return "macOS";
    case "linux":
      return "Linux";
    default:
      return platform;
  }
};

// 检查 Cursor 状态
const checkCursorStatus = async () => {
  loading.status = true;
  try {
    const result = await sendTaskToVscode("isCursorInstalled", {});
    cursorStatus.installed = result.success && result.data;

    if (cursorStatus.installed) {
      const systemResult = await sendTaskToVscode("getSystemInfo", {});
      if (systemResult.success) {
        Object.assign(systemInfo, systemResult.data);
      }
    }

    message.success(
      `Cursor 状态: ${cursorStatus.installed ? "已安装" : "未安装"}`,
    );
  } catch (error) {
    console.error("检查 Cursor 状态失败:", error);
    message.error("检查 Cursor 状态失败");
  } finally {
    loading.status = false;
  }
};

// 加载设置
const loadSettings = async () => {
  loading.load = true;
  try {
    // 获取用户规则（从 Cursor settings.json 中）
    const rulesResult = await sendTaskToVscode("getUserRules", {});
    if (rulesResult.success) {
      cursorRules.value = rulesResult.data || "";
      message.success("用户规则加载成功");
    } else {
      message.error(rulesResult.error || "加载用户规则失败");
    }
  } catch (error) {
    console.error("加载用户规则失败:", error);
    message.error("加载用户规则失败");
  } finally {
    loading.load = false;
  }
};

// 保存 Cursor 规则
const saveCursorRules = async () => {
  loading.save = true;
  try {
    const result = await sendTaskToVscode("updateUserRules", {
      rules: cursorRules.value,
    });

    if (result.success) {
      message.success("用户规则保存成功");
    } else {
      message.error(result.error || "保存用户规则失败");
    }
  } catch (error) {
    console.error("保存用户规则失败:", error);
    message.error("保存用户规则失败");
  } finally {
    loading.save = false;
  }
};

// 清空 Cursor 规则
const clearCursorRules = async () => {
  loading.clear = true;
  try {
    cursorRules.value = "";
    const result = await sendTaskToVscode("updateUserRules", {
      rules: "",
    });

    if (result.success) {
      message.success("用户规则已清空");
    } else {
      message.error(result.error || "清空用户规则失败");
    }
  } catch (error) {
    console.error("清空用户规则失败:", error);
    message.error("清空用户规则失败");
  } finally {
    loading.clear = false;
  }
};

// 加载 MCP 服务器
const loadMcpServers = async () => {
  loading.mcp = true;
  try {
    const result = await sendTaskToVscode("getMcpServers", {});
    if (result.success) {
      mcpServers.value = Object.entries(result.data || {}).map(
        ([name, config]: [string, Omit<McpServerConfig, "name" | "key">]) => ({
          key: name,
          name,
          ...config,
        }),
      );
      message.success("MCP 服务器列表加载成功");
    } else {
      message.error(result.error || "加载 MCP 服务器失败");
    }
  } catch (error) {
    console.error("加载 MCP 服务器失败:", error);
    message.error("加载 MCP 服务器失败");
  } finally {
    loading.mcp = false;
  }
};

// 显示添加 MCP 模态框
const showAddMcpModal = () => {
  mcpModalVisible.value = true;
  // 重置表单
  Object.assign(newMcpServer, {
    name: "",
    type: "command",
    command: "",
    url: "",
    argsText: "",
    envText: "",
  });
};

// 添加 MCP 服务器
const addMcpServer = async () => {
  if (!newMcpServer.name) {
    message.error("请输入服务器名称");
    return;
  }

  loading.addMcp = true;
  try {
    const config: Partial<McpServerConfig> = {};

    if (newMcpServer.type === "command") {
      if (!newMcpServer.command) {
        message.error("请输入命令");
        return;
      }
      config.command = newMcpServer.command;
      config.args = newMcpServer.argsText
        .split("\n")
        .map((arg) => arg.trim())
        .filter((arg) => arg);
    } else {
      if (!newMcpServer.url) {
        message.error("请输入服务器 URL");
        return;
      }
      config.url = newMcpServer.url;
    }

    // 解析环境变量
    config.env = {};
    if (newMcpServer.envText) {
      newMcpServer.envText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && line.includes("="))
        .forEach((line) => {
          const [key, ...valueParts] = line.split("=");
          if (config.env) {
            config.env[key.trim()] = valueParts.join("=").trim();
          }
        });
    }

    const result = await sendTaskToVscode("addMcpServer", {
      name: newMcpServer.name,
      config,
    });

    if (result.success) {
      message.success("MCP 服务器添加成功");
      mcpModalVisible.value = false;
      await loadMcpServers();
    } else {
      message.error(result.error || "添加 MCP 服务器失败");
    }
  } catch (error) {
    console.error("添加 MCP 服务器失败:", error);
    message.error("添加 MCP 服务器失败");
  } finally {
    loading.addMcp = false;
  }
};

// 取消添加 MCP
const cancelAddMcp = () => {
  mcpModalVisible.value = false;
};

// 删除 MCP 服务器
const removeMcpServer = async (name: string) => {
  try {
    const result = await sendTaskToVscode("removeMcpServer", { name });
    if (result.success) {
      message.success("MCP 服务器删除成功");
      await loadMcpServers();
    } else {
      message.error(result.error || "删除 MCP 服务器失败");
    }
  } catch (error) {
    console.error("删除 MCP 服务器失败:", error);
    message.error("删除 MCP 服务器失败");
  }
};

// 发送到 Cursor Chat
const sendToCursorChat = async () => {
  if (!chatMessage.value.trim()) {
    message.error("请输入要发送的消息");
    return;
  }

  loading.chat = true;
  try {
    const result = await sendTaskToVscode("openCursorChat", {
      message: chatMessage.value,
    });

    if (result.success) {
      message.success("消息已发送到 Cursor Chat");
      chatMessage.value = "";
    } else {
      message.warning(result.error || "发送失败，消息可能已复制到剪贴板");
    }
  } catch (error) {
    console.error("发送到 Cursor Chat 失败:", error);
    message.error("发送到 Cursor Chat 失败");
  } finally {
    loading.chat = false;
  }
};

// 打开 Cursor Chat
const openCursorChat = async () => {
  loading.openChat = true;
  try {
    const result = await sendTaskToVscode("openCursorChat", {});
    if (result.success) {
      message.success("Cursor Chat 已打开");
    } else {
      message.error(result.error || "打开 Cursor Chat 失败");
    }
  } catch (error) {
    console.error("打开 Cursor Chat 失败:", error);
    message.error("打开 Cursor Chat 失败");
  } finally {
    loading.openChat = false;
  }
};

// 打开 Cursor
const openCursor = async () => {
  loading.openCursor = true;
  try {
    const result = await sendTaskToVscode("openCursor", {});
    if (result.success) {
      message.success("Cursor 已打开");
    } else {
      message.error(result.error || "打开 Cursor 失败");
    }
  } catch (error) {
    console.error("打开 Cursor 失败:", error);
    message.error("打开 Cursor 失败");
  } finally {
    loading.openCursor = false;
  }
};

// 显示自定义安装路径模态框
const showCustomPathModal = () => {
  customPathModalVisible.value = true;
  customInstallPath.value = "";
};

// 设置自定义安装路径
const setCustomInstallPath = async () => {
  if (!customInstallPath.value.trim()) {
    message.error("请输入安装路径");
    return;
  }

  loading.customPath = true;
  try {
    console.log("发送自定义路径:", customInstallPath.value.trim());

    const result = await sendTaskToVscode("setCustomInstallPath", {
      path: customInstallPath.value.trim(),
    });

    console.log("收到响应:", result);

    // 修复响应处理逻辑
    if (result && result.success) {
      message.success("安装路径设置成功，正在重新检测...");
      customPathModalVisible.value = false;

      // 更新状态
      if (result.isInstalled !== undefined) {
        cursorStatus.installed = result.isInstalled;
      }

      // 更新系统信息
      if (result.systemInfo) {
        Object.assign(systemInfo, result.systemInfo);
      }

      // 重新检查状态以确保数据同步
      await checkCursorStatus();
    } else {
      const errorMsg = result?.error || "设置安装路径失败";
      message.error(errorMsg);
    }
  } catch (error) {
    console.error("设置安装路径失败:", error);
    message.error(
      "设置安装路径失败: " +
        (error instanceof Error ? error.message : String(error)),
    );
  } finally {
    loading.customPath = false;
  }
};

// 取消自定义路径设置
const cancelCustomPath = () => {
  customPathModalVisible.value = false;
  customInstallPath.value = "";
};

// 组件挂载时初始化
onMounted(async () => {
  await checkCursorStatus();
  if (cursorStatus.installed) {
    await loadSettings();
    await loadMcpServers();
  }
});
</script>

<style scoped lang="scss">
@import "./index.scss";
</style>
