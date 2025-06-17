<template>
  <div class="cursor-page">
    <div class="page-header">
      <h2>Cursor 管理中心</h2>
      <p>管理 Cursor 编辑器的集成功能和配置</p>
    </div>

    <a-tabs v-model:activeKey="activeTab" class="main-tabs">
      <a-tab-pane v-for="item in tabItems" :key="item.key" :tab="item.tab">
        <BasicInfo
          v-if="item.key === 'basic'"
          :cursor-status="{ installed: true }"
          :system-info="systemInfo"
          :cursor-user-info="userInfo"
          :loading="loading"
          @check-status="checkSystemStatus"
          @show-custom-path="showCustomPathModal"
          @load-user-info="loadUserInfo"
        />

        <RulesManagement
          v-else-if="item.key === 'rules'"
          :user-info="userInfo"
          :loading="loading"
          :cursor-rules="cursorRules"
          @load-rules="loadRules"
          @save-rules="saveRules"
          @clear-rules="clearRules"
          @update:cursor-rules="cursorRules = $event"
        />

        <McpManagement
          v-else-if="item.key === 'mcp'"
          :user-info="userInfo"
          :loading="loading"
          :mcp-servers="mcpServers"
          @load-servers="loadMcpServers"
          @show-add-modal="showAddMcpModal"
          @remove-server="removeMcpServer"
        />

        <CloudSync
          v-else-if="item.key === 'sync'"
          :user-info="userInfo"
          :sync-info="syncInfo"
          :sync-logs="syncLogs"
          :loading="loading"
          @sync-data="handleSyncData"
          @toggle-auto-sync="toggleAutoSync"
          @login-user="handleLoginUser"
          @logout-user="handleLogoutUser"
          @sync-all-data="handleSyncAllData"
          @sync-rules-to-cloud="handleSyncRulesToCloud"
          @sync-rules-from-cloud="handleSyncRulesFromCloud"
          @sync-mcp-to-cloud="handleSyncMcpToCloud"
          @sync-mcp-from-cloud="handleSyncMcpFromCloud"
          @clear-sync-logs="handleClearSyncLogs"
        />

        <QuickChat
          v-else-if="item.key === 'chat'"
          :user-info="userInfo"
          :loading="loading"
          :chat-message="''"
        />

        <ServerTest
          v-else-if="item.key === 'test'"
          :test-logs="testLogs"
          :loading="loading"
          @test-server="testServerConnection"
        />
      </a-tab-pane>
    </a-tabs>

    <!-- 自定义路径模态框 -->
    <a-modal
      v-model:open="showPathModal"
      title="设置自定义路径"
      @ok="handleSetCustomPath"
      @cancel="showPathModal = false"
    >
      <a-form layout="vertical">
        <a-form-item label="Cursor 安装路径">
          <a-input
            v-model:value="customPath.cursor"
            placeholder="请输入 Cursor 安装路径"
          />
        </a-form-item>
        <a-form-item label="配置文件路径">
          <a-input
            v-model:value="customPath.config"
            placeholder="请输入配置文件路径"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加MCP服务器模态框 -->
    <a-modal
      v-model:open="showMcpModal"
      title="添加MCP服务器"
      @ok="handleAddMcpServer"
      @cancel="showMcpModal = false"
    >
      <a-form layout="vertical">
        <a-form-item label="服务器名称" required>
          <a-input
            v-model:value="newMcpServer.name"
            placeholder="请输入服务器名称"
          />
        </a-form-item>
        <a-form-item label="命令" required>
          <a-input
            v-model:value="newMcpServer.command"
            placeholder="请输入执行命令"
          />
        </a-form-item>
        <a-form-item label="参数">
          <a-input
            v-model:value="newMcpServer.argsText"
            placeholder="请输入参数，用空格分隔"
          />
        </a-form-item>
        <a-form-item label="环境变量">
          <a-textarea
            v-model:value="newMcpServer.envText"
            placeholder="请输入环境变量，格式：KEY=VALUE，每行一个"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";

import {
  authService,
  mcpService,
  userService,
} from "../../services/pluginService";
import { testServerHealth } from "../../utils/serverHealthCheck";
import { sendTaskToVscode } from "../../utils/vscodeUtils";
import BasicInfo from "./components/BasicInfo.vue";
import CloudSync from "./components/CloudSync.vue";
import McpManagement from "./components/McpManagement.vue";
import QuickChat from "./components/QuickChat.vue";
import RulesManagement from "./components/RulesManagement.vue";
import ServerTest from "./components/ServerTest.vue";
import {
  createInitialState,
  createLogAdder,
  createTabItems,
  handleSystemCheck,
  handleUserInfoLoad,
} from "./utils/cursorUtils";

// 响应式数据
const activeTab = ref("basic");
const showPathModal = ref(false);
const showMcpModal = ref(false);
const customPath = reactive({
  cursor: "",
  config: "",
});

// 新增：规则和MCP数据
const cursorRules = ref("");

interface McpServer {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

interface McpConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

// 添加API响应类型定义
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

interface AuthData {
  token: string;
  user?: Record<string, unknown>;
}

interface UserRulesData {
  rules: Array<{
    id: number;
    ruleName: string;
    ruleContent: string;
    sortOrder: number;
  }>;
}

interface McpData {
  mcps: Array<{
    id: number;
    serverName: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
    sortOrder: number;
  }>;
}

const mcpServers = ref<McpServer[]>([]);
const newMcpServer = reactive({
  name: "",
  command: "",
  argsText: "",
  envText: "",
});

// 使用工具函数创建初始状态
const state = createInitialState();
const systemInfo = reactive(state.systemInfo);
const userInfo = reactive(state.userInfo);
const syncInfo = reactive(state.syncInfo);
const loading = reactive(state.loading);
const syncLogs = ref(state.syncLogs);
const testLogs = ref(state.testLogs);

// 标签页配置
const tabItems = createTabItems();

// 日志添加函数
const addSyncLog = createLogAdder(syncLogs, 50);
const addTestLog = createLogAdder(testLogs, 100);

// 系统状态检查
const checkSystemStatus = () => {
  handleSystemCheck(loading, systemInfo, addTestLog);
};

// 用户信息加载
const loadUserInfo = () => {
  handleUserInfoLoad(loading, userInfo, addTestLog);
};

// 显示自定义路径模态框
const showCustomPathModal = () => {
  customPath.cursor = systemInfo.cursorPath || "";
  customPath.config = systemInfo.configPath || "";
  showPathModal.value = true;
};

// 设置自定义路径
const handleSetCustomPath = async () => {
  try {
    await sendTaskToVscode("setCustomPath", customPath);
    systemInfo.cursorPath = customPath.cursor;
    systemInfo.configPath = customPath.config;
    showPathModal.value = false;
    addTestLog("路径设置成功", "success");
  } catch (error) {
    addTestLog(`路径设置失败: ${error}`, "error");
  }
};

// 新增：规则管理功能
const loadRules = async () => {
  loading.load = true;
  addTestLog("开始加载规则...", "info");

  try {
    const result = await sendTaskToVscode("getUserRules");
    cursorRules.value = result || "";
    addTestLog("规则加载成功", "success");
  } catch (error) {
    addTestLog(`规则加载失败: ${error}`, "error");
  } finally {
    loading.load = false;
  }
};

const saveRules = async () => {
  loading.save = true;
  addTestLog("开始保存规则...", "info");

  try {
    await sendTaskToVscode("updateUserRules", { rules: cursorRules.value });
    addTestLog("规则保存成功", "success");
  } catch (error) {
    addTestLog(`规则保存失败: ${error}`, "error");
  } finally {
    loading.save = false;
  }
};

const clearRules = async () => {
  loading.clear = true;
  addTestLog("开始清空规则...", "info");

  try {
    cursorRules.value = "";
    await sendTaskToVscode("updateUserRules", { rules: "" });
    addTestLog("规则清空成功", "success");
  } catch (error) {
    addTestLog(`规则清空失败: ${error}`, "error");
  } finally {
    loading.clear = false;
  }
};

/**
 * 同步MCP服务器到数据库
 */
const syncMcpServersToDatabase = async () => {
  // 检查云端登录状态
  const cloudToken = localStorage.getItem("diflow_cloud_token");
  const cloudEmail = localStorage.getItem("diflow_cloud_email");

  if (!cloudToken || !cloudEmail) {
    addTestLog("用户未登录云端，跳过数据库同步", "info");
    return;
  }

  try {
    // 将当前MCP服务器列表转换为数据库格式
    const mcpsForDatabase = mcpServers.value.map((server, index) => ({
      serverName: server.name,
      command: server.command,
      args: server.args || [],
      env: server.env || {},
      sortOrder: index + 1,
    }));

    const result = await mcpService.saveMcpServers(
      cloudEmail,
      mcpsForDatabase,
      cloudToken,
    );

    if (result.success) {
      addTestLog("MCP配置已同步到数据库", "success");
    } else {
      const errorMsg = "message" in result ? result.message : "未知错误";
      addTestLog(`数据库同步失败: ${errorMsg}`, "error");
    }
  } catch (error) {
    addTestLog(`数据库同步异常: ${error}`, "error");
  }
};

/**
 * 从数据库加载MCP服务器配置
 */
const loadMcpServersFromDatabase = async (): Promise<McpServer[]> => {
  // 检查云端登录状态
  const cloudToken = localStorage.getItem("diflow_cloud_token");
  const cloudEmail = localStorage.getItem("diflow_cloud_email");

  if (!cloudToken || !cloudEmail) {
    addTestLog("用户未登录云端，跳过数据库加载", "info");
    return [];
  }

  try {
    const result = await mcpService.getMcpServers(cloudEmail, cloudToken);
    if (result.success && "data" in result && result.data) {
      const mcpData = result.data as {
        mcps?: Array<{
          serverName: string;
          command: string;
          args?: string[];
          env?: Record<string, string>;
        }>;
      };

      if (mcpData.mcps) {
        addTestLog("从数据库加载MCP配置成功", "success");
        return mcpData.mcps.map(
          (mcp): McpServer => ({
            name: mcp.serverName,
            command: mcp.command,
            args: mcp.args ?? [],
            env: mcp.env ?? {},
          }),
        );
      }
    }
    addTestLog("数据库中无MCP配置", "info");
    return [];
  } catch (error) {
    addTestLog(`从数据库加载MCP配置失败: ${error}`, "error");
    return [];
  }
};

// 修改：MCP管理功能
const loadMcpServers = async () => {
  loading.mcp = true;
  addTestLog("开始加载MCP服务器...", "info");

  try {
    // 1. 从本地配置文件加载
    const localResult = await sendTaskToVscode("getMcpServers");
    let localServers: McpServer[] = [];

    if (localResult && typeof localResult === "object") {
      localServers = Object.entries(localResult).map(
        ([name, config]: [string, McpConfig]): McpServer => ({
          name,
          command: config.command,
          args: config.args ?? [],
          env: config.env ?? {},
        }),
      );
    }

    // 2. 从数据库加载（如果用户已登录）
    const databaseServers = await loadMcpServersFromDatabase();

    // 3. 合并本地和数据库配置（优先使用本地配置）
    const serverMap = new Map<string, McpServer>();

    // 先添加数据库配置
    databaseServers.forEach((server) => {
      serverMap.set(server.name, server);
    });

    // 再添加本地配置（会覆盖同名的数据库配置）
    localServers.forEach((server) => {
      serverMap.set(server.name, server);
    });

    mcpServers.value = Array.from(serverMap.values());
    addTestLog(
      `MCP服务器加载成功，共${mcpServers.value.length}个服务器`,
      "success",
    );
  } catch (error) {
    addTestLog(`MCP服务器加载失败: ${error}`, "error");
  } finally {
    loading.mcp = false;
  }
};

const showAddMcpModal = () => {
  // 重置表单
  newMcpServer.name = "";
  newMcpServer.command = "";
  newMcpServer.argsText = "";
  newMcpServer.envText = "";
  showMcpModal.value = true;
};

const handleAddMcpServer = async () => {
  if (!newMcpServer.name || !newMcpServer.command) {
    addTestLog("请填写服务器名称和命令", "error");
    return;
  }

  try {
    // 解析参数和环境变量
    const args = newMcpServer.argsText
      ? newMcpServer.argsText.split(/\s+/)
      : [];
    const env: Record<string, string> = {};

    if (newMcpServer.envText) {
      newMcpServer.envText.split("\n").forEach((line) => {
        const [key, ...valueParts] = line.split("=");
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join("=").trim();
        }
      });
    }

    const config = {
      command: newMcpServer.command,
      args,
      env,
    };

    // 1. 更新本地配置文件
    await sendTaskToVscode("addMcpServer", {
      name: newMcpServer.name,
      config,
    });

    addTestLog("MCP服务器本地配置添加成功", "success");
    showMcpModal.value = false;

    // 2. 重新加载服务器列表
    await loadMcpServers();

    // 3. 同步到数据库
    await syncMcpServersToDatabase();
  } catch (error) {
    addTestLog(`MCP服务器添加失败: ${error}`, "error");
  }
};

const removeMcpServer = async (name: string) => {
  try {
    // 1. 从本地配置文件删除
    await sendTaskToVscode("removeMcpServer", { name });
    addTestLog(`MCP服务器 ${name} 本地配置删除成功`, "success");

    // 2. 重新加载服务器列表
    await loadMcpServers();

    // 3. 同步到数据库
    await syncMcpServersToDatabase();
  } catch (error) {
    addTestLog(`MCP服务器删除失败: ${error}`, "error");
  }
};

// 数据同步
const handleSyncData = async () => {
  loading.sync = true;
  addSyncLog("开始同步数据...", "info");

  try {
    // 检查用户登录状态
    if (!userInfo.isLoggedIn) {
      addSyncLog("用户未登录，执行本地同步", "info");
      await sendTaskToVscode("syncData");
      addSyncLog("本地数据同步成功", "success");
    } else {
      // 用户已登录，执行云端同步
      await handleSyncAllData();
    }

    syncInfo.lastSyncTime = new Date();
    syncInfo.syncStatus = "已同步";
  } catch (error) {
    addSyncLog(`同步错误: ${error}`, "error");
  } finally {
    loading.sync = false;
  }
};

// 切换自动同步
const toggleAutoSync = async () => {
  try {
    await sendTaskToVscode("toggleAutoSync", { enabled: !syncInfo.autoSync });
    syncInfo.autoSync = !syncInfo.autoSync;
    addTestLog(`自动同步已${syncInfo.autoSync ? "开启" : "关闭"}`, "success");
  } catch (error) {
    addTestLog(`自动同步设置失败: ${error}`, "error");
  }
};

// 服务器连接测试
const testServerConnection = async () => {
  loading.test = true;
  addTestLog("开始测试服务器连接...", "info");

  try {
    const result = await testServerHealth();

    if (result.isHealthy) {
      addTestLog(result.summary, "success");
      result.results.forEach((r) => {
        if (r.status === "success") {
          addTestLog(
            `✓ ${r.endpoint || "Unknown"}: ${r.statusCode}`,
            "success",
          );
        } else {
          addTestLog(`✗ ${r.endpoint || "Unknown"}: ${r.message}`, "error");
        }
      });
    } else {
      addTestLog(result.summary, "error");
      result.results.forEach((r) => {
        if (r.status === "error") {
          addTestLog(`✗ ${r.endpoint || "Unknown"}: ${r.message}`, "error");
        }
      });
    }
  } catch (error) {
    addTestLog(`服务器测试错误: ${error}`, "error");
  } finally {
    loading.test = false;
  }
};

/**
 * 检查云端登录状态
 */
const checkCloudLoginStatus = async () => {
  try {
    // 1. 从本地存储检查保存的云端认证信息
    const savedToken = localStorage.getItem("diflow_cloud_token");
    const savedEmail = localStorage.getItem("diflow_cloud_email");
    const savedUsername = localStorage.getItem("diflow_cloud_username");
    const savedCursorUserId = localStorage.getItem(
      "diflow_cloud_cursor_user_id",
    );
    const savedAvatar = localStorage.getItem("diflow_cloud_avatar");

    if (savedToken && savedEmail) {
      // 如果有保存的云端认证信息，恢复登录状态
      userInfo.email = savedEmail;
      userInfo.username = savedUsername || "";
      userInfo.cursorUserId = savedCursorUserId || "";
      userInfo.avatar = savedAvatar || "";
      userInfo.token = savedToken;
      userInfo.isLoggedIn = true;

      syncInfo.syncStatus = "已连接";
      addSyncLog("检测到已保存的云端登录状态", "info");
      return;
    }

    // 2. 如果没有保存的云端认证信息，检查是否可以自动登录
    const cursorUserInfo = await sendTaskToVscode("getCursorUserInfo");

    if (cursorUserInfo && cursorUserInfo.email && cursorUserInfo.isLoggedIn) {
      addSyncLog("检测到 Cursor 用户信息，开始自动云端认证...", "info");

      // 自动执行云端认证
      try {
        const authResult = await authService.loginOrCreateUser(
          cursorUserInfo.email,
          cursorUserInfo.username,
          cursorUserInfo.cursorUserId,
          cursorUserInfo.avatar,
        );

        if (authResult.success && "data" in authResult && authResult.data) {
          // 更新用户信息
          const authData = authResult.data as AuthData;
          userInfo.email = cursorUserInfo.email;
          userInfo.username = cursorUserInfo.username || "";
          userInfo.cursorUserId = cursorUserInfo.cursorUserId || "";
          userInfo.avatar = cursorUserInfo.avatar || "";
          userInfo.token = authData.token;
          userInfo.isLoggedIn = true;

          // 保存云端认证信息到本地存储
          localStorage.setItem("diflow_cloud_token", authData.token);
          localStorage.setItem("diflow_cloud_email", cursorUserInfo.email);
          localStorage.setItem(
            "diflow_cloud_username",
            cursorUserInfo.username || "",
          );
          localStorage.setItem(
            "diflow_cloud_cursor_user_id",
            cursorUserInfo.cursorUserId || "",
          );
          localStorage.setItem(
            "diflow_cloud_avatar",
            cursorUserInfo.avatar || "",
          );

          addSyncLog("自动云端认证成功", "success");
          syncInfo.syncStatus = "已连接";
          return;
        } else {
          const errorMsg =
            "message" in authResult ? authResult.message : "自动认证失败";
          addSyncLog(`自动云端认证失败: ${errorMsg}`, "error");
        }
      } catch (error) {
        addSyncLog(`自动云端认证异常: ${error}`, "error");
      }
    } else {
      addSyncLog("未检测到 Cursor 用户登录状态", "info");
    }

    // 保持未登录状态
    userInfo.isLoggedIn = false;
    syncInfo.syncStatus = "未连接";
  } catch (error) {
    addSyncLog(`检查登录状态失败: ${error}`, "error");
    userInfo.isLoggedIn = false;
    syncInfo.syncStatus = "未连接";
  }
};

/**
 * 用户登录处理
 */
const handleLoginUser = async () => {
  loading.login = true;
  addSyncLog("开始用户登录...", "info");

  try {
    // 1. 获取Cursor用户信息
    const cursorUserInfo = await sendTaskToVscode("getCursorUserInfo");

    if (!cursorUserInfo || !cursorUserInfo.email) {
      addSyncLog("无法获取Cursor用户信息，请确保Cursor已登录", "error");
      return;
    }

    // 2. 调用认证服务
    const authResult = await authService.loginOrCreateUser(
      cursorUserInfo.email,
      cursorUserInfo.username,
      cursorUserInfo.cursorUserId,
      cursorUserInfo.avatar,
    );

    if (authResult.success && "data" in authResult && authResult.data) {
      // 3. 更新用户信息
      const authData = authResult.data as AuthData;
      userInfo.email = cursorUserInfo.email;
      userInfo.username = cursorUserInfo.username || "";
      userInfo.cursorUserId = cursorUserInfo.cursorUserId || "";
      userInfo.avatar = cursorUserInfo.avatar || "";
      userInfo.token = authData.token;
      userInfo.isLoggedIn = true;

      // 4. 保存云端认证信息到本地存储
      localStorage.setItem("diflow_cloud_token", authData.token);
      localStorage.setItem("diflow_cloud_email", cursorUserInfo.email);
      localStorage.setItem(
        "diflow_cloud_username",
        cursorUserInfo.username || "",
      );
      localStorage.setItem(
        "diflow_cloud_cursor_user_id",
        cursorUserInfo.cursorUserId || "",
      );
      localStorage.setItem("diflow_cloud_avatar", cursorUserInfo.avatar || "");

      addSyncLog("用户登录成功", "success");
      syncInfo.syncStatus = "已连接";
    } else {
      const errorMsg =
        "message" in authResult ? authResult.message : "登录失败";
      addSyncLog(`登录失败: ${errorMsg}`, "error");
    }
  } catch (error) {
    addSyncLog(`登录异常: ${error}`, "error");
  } finally {
    loading.login = false;
  }
};

/**
 * 用户登出处理
 */
const handleLogoutUser = () => {
  loading.logout = true;
  addSyncLog("用户登出...", "info");

  try {
    // 清空用户信息
    userInfo.email = "";
    userInfo.username = "";
    userInfo.cursorUserId = "";
    userInfo.avatar = "";
    userInfo.token = "";
    userInfo.isLoggedIn = false;

    // 清空本地存储的云端认证信息
    localStorage.removeItem("diflow_cloud_token");
    localStorage.removeItem("diflow_cloud_email");
    localStorage.removeItem("diflow_cloud_username");
    localStorage.removeItem("diflow_cloud_cursor_user_id");
    localStorage.removeItem("diflow_cloud_avatar");

    syncInfo.syncStatus = "未连接";
    syncInfo.rulesStatus = "unknown";
    syncInfo.mcpStatus = "unknown";

    addSyncLog("用户登出成功", "success");
  } catch (error) {
    addSyncLog(`登出异常: ${error}`, "error");
  } finally {
    loading.logout = false;
  }
};

/**
 * 同步所有数据到云端
 */
const handleSyncAllData = async () => {
  loading.syncAll = true;
  addSyncLog("开始同步所有数据到云端...", "info");

  try {
    // 并行执行规则和MCP同步
    await Promise.all([handleSyncRulesToCloud(), handleSyncMcpToCloud()]);

    syncInfo.lastSyncTime = new Date();
    syncInfo.syncStatus = "已同步";
    addSyncLog("所有数据同步完成", "success");
  } catch (error) {
    addSyncLog(`同步失败: ${error}`, "error");
  } finally {
    loading.syncAll = false;
  }
};

/**
 * 同步规则到云端
 */
const handleSyncRulesToCloud = async () => {
  // 检查云端登录状态 - 使用userInfo对象而不是localStorage
  if (!userInfo.isLoggedIn || !userInfo.token || !userInfo.email) {
    addSyncLog("用户未登录云端，无法同步规则", "error");
    return;
  }

  loading.syncRules = true;
  addSyncLog("开始同步规则到云端...", "info");

  try {
    // 1. 获取本地规则
    const localRules = await sendTaskToVscode("getUserRules");

    if (!localRules) {
      addSyncLog("本地无规则内容", "info");
      syncInfo.rulesStatus = "synced";
      return;
    }

    // 2. 转换为服务端格式
    const rulesForServer = [
      {
        ruleName: "cursor-rules",
        ruleContent: localRules,
        sortOrder: 1,
      },
    ];

    // 3. 上传到服务端
    const result = await userService.saveUserRules(
      userInfo.email,
      rulesForServer,
      userInfo.token,
    );

    if (result.success) {
      addSyncLog("规则同步到云端成功", "success");
      syncInfo.rulesStatus = "synced";
    } else {
      const errorMsg = "message" in result ? result.message : "同步失败";
      addSyncLog(`规则同步失败: ${errorMsg}`, "error");
      syncInfo.rulesStatus = "error";
    }
  } catch (error) {
    addSyncLog(`规则同步异常: ${error}`, "error");
    syncInfo.rulesStatus = "error";
  } finally {
    loading.syncRules = false;
  }
};

/**
 * 从云端下载规则
 */
const handleSyncRulesFromCloud = async () => {
  // 检查云端登录状态 - 使用userInfo对象而不是localStorage
  if (!userInfo.isLoggedIn || !userInfo.token || !userInfo.email) {
    addSyncLog("用户未登录云端，无法下载规则", "error");
    return;
  }

  loading.syncRules = true;
  addSyncLog("开始从云端下载规则...", "info");

  try {
    // 1. 从服务端获取规则
    const result = await userService.getUserRules(
      userInfo.email,
      userInfo.token,
    );

    if (result.success && "data" in result && result.data) {
      const responseData = result.data as { rules?: any[] };
      const cloudRules = responseData.rules;

      if (cloudRules && cloudRules.length > 0) {
        // 2. 更新本地规则
        const ruleContent = cloudRules[0].ruleContent;
        await sendTaskToVscode("updateUserRules", { rules: ruleContent });

        // 3. 更新界面显示
        cursorRules.value = ruleContent;

        addSyncLog("规则从云端下载成功", "success");
        syncInfo.rulesStatus = "synced";
      } else {
        addTestLog("云端无规则数据", "info");
        syncInfo.rulesStatus = "synced";
      }
    } else {
      const errorMsg = "message" in result ? result.message : "下载失败";
      addTestLog(`规则下载失败: ${errorMsg}`, "error");
      syncInfo.rulesStatus = "error";
    }
  } catch (error) {
    addTestLog(`规则下载异常: ${error}`, "error");
    syncInfo.rulesStatus = "error";
  } finally {
    loading.syncRules = false;
  }
};

/**
 * 同步MCP配置到云端
 */
const handleSyncMcpToCloud = async () => {
  // 检查云端登录状态 - 使用userInfo对象而不是localStorage
  if (!userInfo.isLoggedIn || !userInfo.token || !userInfo.email) {
    addSyncLog("用户未登录云端，无法同步MCP配置", "error");
    return;
  }

  loading.syncMcp = true;
  addSyncLog("开始同步MCP配置到云端...", "info");

  try {
    // 1. 获取本地MCP配置
    const localMcpConfig = await sendTaskToVscode("getMcpServers");

    if (!localMcpConfig || typeof localMcpConfig !== "object") {
      addSyncLog("本地无MCP配置", "info");
      syncInfo.mcpStatus = "synced";
      return;
    }

    // 2. 转换为服务端格式
    const mcpsForServer = Object.entries(localMcpConfig).map(
      (
        [name, config]: [string, McpConfig],
        index,
      ): {
        serverName: string;
        command: string;
        args?: string[];
        env?: Record<string, string>;
        sortOrder: number;
      } => ({
        serverName: name,
        command: config.command,
        args: config.args ?? [],
        env: config.env ?? {},
        sortOrder: index + 1,
      }),
    );

    // 3. 上传到服务端
    const result = await mcpService.saveMcpServers(
      userInfo.email,
      mcpsForServer,
      userInfo.token,
    );

    if (result.success) {
      addSyncLog("MCP配置同步到云端成功", "success");
      syncInfo.mcpStatus = "synced";
    } else {
      const errorMsg = "message" in result ? result.message : "同步失败";
      addSyncLog(`MCP配置同步失败: ${errorMsg}`, "error");
      syncInfo.mcpStatus = "error";
    }
  } catch (error) {
    addSyncLog(`MCP配置同步异常: ${error}`, "error");
    syncInfo.mcpStatus = "error";
  } finally {
    loading.syncMcp = false;
  }
};

/**
 * 从云端下载MCP配置
 */
const handleSyncMcpFromCloud = async () => {
  // 检查云端登录状态 - 使用userInfo对象而不是localStorage
  if (!userInfo.isLoggedIn || !userInfo.token || !userInfo.email) {
    addSyncLog("用户未登录云端，无法下载MCP配置", "error");
    return;
  }

  loading.syncMcp = true;
  addSyncLog("开始从云端下载MCP配置...", "info");

  try {
    // 1. 从服务端获取MCP配置
    const result = await mcpService.getMcpServers(
      userInfo.email,
      userInfo.token,
    );

    if (result.success && "data" in result && result.data) {
      const responseData = result.data as { servers?: any[] };
      const cloudMcps = responseData.servers;

      if (cloudMcps && cloudMcps.length > 0) {
        // 2. 转换为本地格式
        const mcpConfig: Record<string, McpConfig> = {};
        cloudMcps.forEach((mcp: any) => {
          mcpConfig[mcp.serverName] = {
            command: mcp.command,
            args: mcp.args ?? [],
            env: mcp.env ?? {},
          };
        });

        // 3. 更新本地MCP配置
        await sendTaskToVscode("updateMcpServers", { servers: mcpConfig });

        // 4. 重新加载MCP服务器列表
        await loadMcpServers();

        addSyncLog("MCP配置从云端下载成功", "success");
        syncInfo.mcpStatus = "synced";
      } else {
        addTestLog("云端无MCP配置数据", "info");
        syncInfo.mcpStatus = "synced";
      }
    } else {
      const errorMsg = "message" in result ? result.message : "下载失败";
      addTestLog(`MCP配置下载失败: ${errorMsg}`, "error");
      syncInfo.mcpStatus = "error";
    }
  } catch (error) {
    addTestLog(`MCP配置下载异常: ${error}`, "error");
    syncInfo.mcpStatus = "error";
  } finally {
    loading.syncMcp = false;
  }
};

/**
 * 清空同步日志
 */
const handleClearSyncLogs = () => {
  syncLogs.value = [];
  addSyncLog("同步日志已清空", "info");
};

// 初始化函数
onMounted(async () => {
  // 1. 检查系统状态
  checkSystemStatus();

  // 2. 加载用户信息
  loadUserInfo();

  // 3. 检查云端登录状态
  await checkCloudLoginStatus();

  // 4. 加载规则和MCP配置
  await Promise.all([loadRules(), loadMcpServers()]);
});
</script>

<style scoped>
.cursor-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #1f2937;
}

.page-header p {
  margin: 0;
  color: #6b7280;
}

.main-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 添加标签页间距 */
.main-tabs :deep(.ant-tabs-nav) {
  padding: 0 20px;
}

.main-tabs :deep(.ant-tabs-tab) {
  margin: 0 8px;
  padding: 12px 16px;
}

.main-tabs :deep(.ant-tabs-tab-btn) {
  font-weight: 500;
}

.main-tabs :deep(.ant-tabs-content-holder) {
  padding: 20px;
}
</style>
