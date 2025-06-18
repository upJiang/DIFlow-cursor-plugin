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
import { message } from "ant-design-vue";
import { nextTick, onMounted, reactive, ref } from "vue";

import { authApi } from "../../api/auth";
import { mcpApi, type McpServerItem } from "../../api/mcp";
import { type RuleItem, rulesApi } from "../../api/rules";
import {
  authService,
  mcpService,
  userService,
} from "../../services/pluginService";
import { httpRequest } from "../../utils/httpUtils";
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

interface CloudRulesResponse {
  rules?: Array<{
    id: number;
    ruleName: string;
    ruleContent: string;
    sortOrder: number;
  }>;
}

interface CloudMcpResponse {
  mcps?: Array<{
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
const userInfo = ref({
  isLoggedIn: false,
  token: null as string | null,
  email: null as string | null,
  username: "",
  cursorUserId: "",
  avatar: "",
});
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

/**
 * 检查并初始化登录状态
 */
const checkCloudLoginStatus = async () => {
  try {
    console.log("🔍 检查云端登录状态...");

    // 获取当前用户信息
    const cursorUserInfo = await sendTaskToVscode("getCursorUserInfo", {});
    console.log("🔍 当前用户信息:", cursorUserInfo);

    if (!cursorUserInfo || !cursorUserInfo.email) {
      console.log("❌ 用户未登录或无邮箱信息");
      userInfo.value = {
        isLoggedIn: false,
        token: null,
        email: null,
        username: "",
        cursorUserId: "",
        avatar: "",
      };
      return;
    }

    // 获取存储的认证信息
    const savedToken = localStorage.getItem("diflow_cloud_token");
    const savedEmail = localStorage.getItem("diflow_user_email");

    console.log("🔍 当前登录状态:");
    console.log("  - userInfo.isLoggedIn:", userInfo.value.isLoggedIn);
    console.log(
      "  - userInfo.token:",
      userInfo.value.token
        ? `${userInfo.value.token.substring(0, 20)}...`
        : "null",
    );
    console.log("  - userInfo.email:", userInfo.value.email);

    // 检查是否有Auth0 token但没有服务器token
    if (
      cursorUserInfo.token &&
      (!savedToken || savedEmail !== cursorUserInfo.email)
    ) {
      console.log("🔄 检测到Auth0 token，需要转换为服务器token");

      // 解析Auth0 token以获取用户信息
      let auth0TokenPayload: any = null;
      try {
        const tokenParts = cursorUserInfo.token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          auth0TokenPayload = payload;
          console.log("🔍 JWT Token 分析:");
          console.log("  - 解码结果:", jwt_decode(cursorUserInfo.token));
          console.log("  - 当前时间戳:", Math.floor(Date.now() / 1000));
          console.log("  - Token签发时间 (iat):", payload.iat);
          console.log("  - Token过期时间 (exp):", payload.exp);

          // 检查token是否过期
          const currentTime = Math.floor(Date.now() / 1000);
          const isExpired = payload.exp && payload.exp < currentTime;
          console.log("  - Token是否过期:", isExpired);

          if (isExpired) {
            console.log("❌ Auth0 token已过期");
            // 清理过期的认证信息
            localStorage.removeItem("diflow_cloud_token");
            localStorage.removeItem("diflow_user_email");
            userInfo.value = {
              isLoggedIn: false,
              token: null,
              email: null,
              username: "",
              cursorUserId: "",
              avatar: "",
            };
            return;
          }

          console.log("  - Token用户信息:", {
            sub: payload.sub,
            email: payload.email,
            username: payload.username,
          });
        }
      } catch (e) {
        console.error("❌ 解析Auth0 token失败:", e);
      }

      // 使用邮箱信息向服务器换取token
      try {
        console.log("📝 确保localStorage中有正确的认证信息...");

        // 先清理旧的认证信息
        localStorage.removeItem("diflow_cloud_token");
        localStorage.removeItem("diflow_user_email");

        // 调用服务器的email登录接口
        const response = await authApi.emailLogin(
          cursorUserInfo.email,
          cursorUserInfo.username || cursorUserInfo.email.split("@")[0],
          auth0TokenPayload?.sub || "",
          cursorUserInfo.avatar || "",
        );

        if (
          response &&
          response.data &&
          typeof response.data === "object" &&
          "access_token" in response.data
        ) {
          console.log("✅ 成功获取服务器token");
          const accessToken = (response.data as any).access_token;

          // 保存新的认证信息
          localStorage.setItem("diflow_cloud_token", accessToken);
          localStorage.setItem("diflow_user_email", cursorUserInfo.email);

          // 更新用户状态
          userInfo.value = {
            isLoggedIn: true,
            token: accessToken,
            email: cursorUserInfo.email,
            username: cursorUserInfo.username || "",
            cursorUserId: auth0TokenPayload?.sub || "",
            avatar: cursorUserInfo.avatar || "",
          };

          console.log("🔍 验证localStorage中的认证信息:");
          console.log(
            "  - savedToken:",
            localStorage.getItem("diflow_cloud_token")
              ? `${localStorage
                  .getItem("diflow_cloud_token")!
                  .substring(0, 20)}...`
              : "null",
          );
          console.log(
            "  - savedEmail:",
            localStorage.getItem("diflow_user_email"),
          );
          console.log(
            "  - token匹配:",
            localStorage.getItem("diflow_cloud_token") === accessToken,
          );

          return;
        } else {
          console.error("❌ 服务器返回无效的token响应:", response);
        }
      } catch (error) {
        console.error("❌ token交换失败:", error);
        // 清理无效的登录状态
        localStorage.removeItem("diflow_cloud_token");
        localStorage.removeItem("diflow_user_email");
        userInfo.value = {
          isLoggedIn: false,
          token: null,
          email: null,
          username: "",
          cursorUserId: "",
          avatar: "",
        };
        return;
      }
    }

    // 如果已有有效的服务器token，验证其有效性
    if (savedToken && savedEmail === cursorUserInfo.email) {
      console.log("🔍 验证现有服务器token...");

      try {
        // 尝试解码token检查是否过期
        const tokenParts = savedToken.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const isExpired = payload.exp && payload.exp < currentTime;

          if (isExpired) {
            console.log("❌ 服务器token已过期，重新获取");
            localStorage.removeItem("diflow_cloud_token");
            localStorage.removeItem("diflow_user_email");
            // 递归调用重新获取token
            return await checkCloudLoginStatus();
          }
        }

        // Token有效，更新用户状态
        userInfo.value = {
          isLoggedIn: true,
          token: savedToken,
          email: cursorUserInfo.email,
          username: cursorUserInfo.username || "",
          cursorUserId: cursorUserInfo.cursorUserId || "",
          avatar: cursorUserInfo.avatar || "",
        };
        console.log("✅ 使用现有有效token");
        return;
      } catch (error) {
        console.error("❌ 验证token失败:", error);
        localStorage.removeItem("diflow_cloud_token");
        localStorage.removeItem("diflow_user_email");
      }
    }

    // 如果没有有效token，设置为未登录状态
    userInfo.value = {
      isLoggedIn: false,
      token: null,
      email: null,
      username: "",
      cursorUserId: "",
      avatar: "",
    };
  } catch (error) {
    console.error("❌ 检查云端登录状态失败:", error);
    userInfo.value = {
      isLoggedIn: false,
      token: null,
      email: null,
      username: "",
      cursorUserId: "",
      avatar: "",
    };
  }
};

/**
 * 处理同步数据 - CloudSync组件需要的函数
 */
const handleSyncData = async () => {
  console.log("处理同步数据...");
  await handleSyncAllData();
};

/**
 * 切换自动同步 - CloudSync组件需要的函数
 */
const toggleAutoSync = (enabled: boolean) => {
  console.log("切换自动同步:", enabled);
  syncInfo.autoSync = enabled;
  addSyncLog(`自动同步已${enabled ? "开启" : "关闭"}`, "info");
};

/**
 * 处理用户登录 - CloudSync组件需要的函数
 */
const handleLoginUser = () => {
  console.log("处理用户登录...");
  addSyncLog("请在浏览器中完成登录", "info");
  // 这里可以添加打开登录页面的逻辑
};

/**
 * 处理用户退出 - CloudSync组件需要的函数
 */
const handleLogoutUser = () => {
  console.log("处理用户退出...");

  // 清除localStorage中的认证信息
  localStorage.removeItem("diflow_cloud_token");
  localStorage.removeItem("diflow_user_email");

  // 清除userInfo
  userInfo.value = {
    isLoggedIn: false,
    token: null,
    email: null,
    username: "",
    cursorUserId: "",
    avatar: "",
  };

  addSyncLog("用户已退出登录", "success");
};

/**
 * 测试服务器连接 - ServerTest组件需要的函数
 */
const testServerConnection = async () => {
  console.log("测试服务器连接...");
  addTestLog("开始测试服务器连接...", "info");

  try {
    // 测试基本连接
    const response = await httpRequest("GET", "/health");
    if (response) {
      addTestLog("服务器连接测试成功", "success");
    } else {
      addTestLog("服务器连接测试失败", "error");
    }
  } catch (error) {
    addTestLog(`服务器连接测试失败: ${error}`, "error");
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
  // 检查登录状态
  const cloudToken = localStorage.getItem("diflow_cloud_token");
  const cloudEmail = localStorage.getItem("diflow_user_email");

  if (!cloudToken || !cloudEmail) {
    addTestLog("用户未登录，跳过数据库同步", "info");
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

    const result = await mcpService.saveMcpServers(mcpsForDatabase);

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
  console.log("🔍 开始从数据库加载MCP服务器配置...");

  // 优先检查userInfo中的登录状态
  console.log("🔍 数据库加载检查:");
  console.log("  - userInfo.isLoggedIn:", userInfo.value.isLoggedIn);
  console.log(
    "  - userInfo.token:",
    userInfo.value.token
      ? `${userInfo.value.token.substring(0, 20)}...`
      : "null",
  );
  console.log("  - userInfo.email:", userInfo.value.email);

  if (
    !userInfo.value.isLoggedIn ||
    !userInfo.value.token ||
    !userInfo.value.email
  ) {
    console.log("⚠️ 用户未登录，跳过数据库加载");
    addTestLog("用户未登录，跳过数据库加载", "info");
    return [];
  }

  console.log("✅ 用户已登录，开始从数据库获取MCP配置");

  try {
    const result = await mcpService.getMcpServers();
    console.log("🔍 数据库查询结果:", result);

    if (result.success && "data" in result && result.data) {
      const responseData = result.data as CloudMcpResponse;
      console.log("🔍 解析后的响应数据:", responseData);

      if (responseData.mcps) {
        console.log(`✅ 从数据库加载到 ${responseData.mcps.length} 个MCP配置`);
        addTestLog("从数据库加载MCP配置成功", "success");
        return responseData.mcps.map(
          (mcp): McpServer => ({
            name: mcp.serverName,
            command: mcp.command,
            args: mcp.args ?? [],
            env: mcp.env ?? {},
          }),
        );
      }
    }
    console.log("⚠️ 数据库中无MCP配置");
    addTestLog("数据库中无MCP配置", "info");
    return [];
  } catch (error) {
    console.log("❌ 从数据库加载MCP配置失败:", error);
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

/**
 * 同步所有数据到云端
 */
const handleSyncAllData = async () => {
  console.log("🔄 开始同步所有数据...");
  console.log("🔍 当前登录状态:");
  console.log("  - userInfo.isLoggedIn:", userInfo.value.isLoggedIn);
  console.log(
    "  - userInfo.token:",
    userInfo.value.token
      ? `${userInfo.value.token.substring(0, 20)}...`
      : "null",
  );
  console.log("  - userInfo.email:", userInfo.value.email);

  // 如果用户未登录，提示先登录
  if (
    !userInfo.value.isLoggedIn ||
    !userInfo.value.token ||
    !userInfo.value.email
  ) {
    addSyncLog("用户未登录，无法同步数据", "error");
    addSyncLog("请先点击登录按钮进行认证", "info");
    return;
  }

  // 解码并检查JWT token
  console.log("🔍 JWT Token 分析:");
  const decodedToken = decodeJWT(userInfo.value.token);
  console.log("  - 解码结果:", decodedToken);

  if ("payload" in decodedToken && decodedToken.payload) {
    const now = Math.floor(Date.now() / 1000);
    console.log("  - 当前时间戳:", now);
    console.log("  - Token签发时间 (iat):", decodedToken.payload.iat);
    console.log("  - Token过期时间 (exp):", decodedToken.payload.exp);

    if (decodedToken.payload.exp) {
      const isExpired = now > decodedToken.payload.exp;
      console.log("  - Token是否过期:", isExpired);

      if (isExpired) {
        addSyncLog("Token已过期，请重新登录", "error");
        // 清除过期的token
        userInfo.value.token = null;
        userInfo.value.isLoggedIn = false;
        localStorage.removeItem("diflow_cloud_token");
        return;
      }
    }

    console.log("  - Token用户信息:", {
      sub: decodedToken.payload.sub,
      email: decodedToken.payload.email,
      username: decodedToken.payload.username,
    });
  }

  // 确保localStorage中有正确的token
  console.log("📝 确保localStorage中有正确的认证信息...");
  localStorage.setItem("diflow_cloud_token", userInfo.value.token);
  localStorage.setItem("diflow_user_email", userInfo.value.email);
  if (userInfo.value.username) {
    localStorage.setItem("diflow_cloud_username", userInfo.value.username);
  }
  if (userInfo.value.cursorUserId) {
    localStorage.setItem(
      "diflow_cloud_cursor_user_id",
      userInfo.value.cursorUserId,
    );
  }
  if (userInfo.value.avatar) {
    localStorage.setItem("diflow_cloud_avatar", userInfo.value.avatar);
  }

  // 等待一小段时间确保localStorage写入完成
  await new Promise((resolve) => setTimeout(resolve, 100));

  // 验证localStorage中的token
  const savedToken = localStorage.getItem("diflow_cloud_token");
  const savedEmail = localStorage.getItem("diflow_user_email");
  console.log("🔍 验证localStorage中的认证信息:");
  console.log(
    "  - savedToken:",
    savedToken ? `${savedToken.substring(0, 20)}...` : "null",
  );
  console.log("  - savedEmail:", savedEmail);
  console.log("  - token匹配:", savedToken === userInfo.value.token);

  if (!savedToken || savedToken !== userInfo.value.token) {
    addSyncLog("认证信息保存失败，无法同步", "error");
    return;
  }

  loading.syncAll = true;
  addSyncLog("开始同步所有数据...", "info");

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
 * 同步用户规则到云端
 */
const handleSyncRulesToCloud = async () => {
  try {
    console.log("🔄 开始同步用户规则...");

    // 检查登录状态
    if (!userInfo.value.isLoggedIn || !userInfo.value.email) {
      message.warning("请先登录账户");
      return;
    }

    // 获取当前规则
    const currentRules = cursorRules.value;
    if (!currentRules || currentRules.trim() === "") {
      message.warning("当前没有规则需要同步");
      return;
    }

    // 格式化规则数据
    const rules: RuleItem[] = [
      {
        ruleName: "cursor_rules",
        ruleContent: currentRules,
        sortOrder: 1,
      },
    ];

    // 调用API同步规则
    const result = await rulesApi.syncUserRules(rules);

    if (result.success) {
      message.success("规则同步成功");
      addSyncLog("规则同步成功", "success");
    } else {
      message.error(result.message || "规则同步失败");
      addSyncLog(`规则同步失败: ${result.message}`, "error");
    }
  } catch (error) {
    console.error("同步规则失败:", error);
    message.error(`同步规则失败: ${error}`);
    addSyncLog(`同步规则失败: ${error}`, "error");
  }
};

/**
 * 从云端下载规则
 */
const handleSyncRulesFromCloud = async () => {
  // 检查登录状态 - 使用userInfo对象而不是localStorage
  if (
    !userInfo.value.isLoggedIn ||
    !userInfo.value.token ||
    !userInfo.value.email
  ) {
    addSyncLog("用户未登录，无法下载规则", "error");
    return;
  }

  loading.syncRules = true;
  addSyncLog("开始从服务端下载规则...", "info");

  try {
    // 1. 从服务端获取规则
    const result = await userService.getUserRules();

    if (result.success && "data" in result && result.data) {
      const responseData = result.data as CloudRulesResponse;
      const cloudRules = responseData.rules;

      if (cloudRules && cloudRules.length > 0) {
        // 2. 更新本地规则
        const ruleContent = cloudRules[0].ruleContent;
        await sendTaskToVscode("updateUserRules", { rules: ruleContent });

        // 3. 更新界面显示
        cursorRules.value = ruleContent;

        addSyncLog("规则从服务端下载成功", "success");
        syncInfo.rulesStatus = "synced";
      } else {
        addTestLog("服务端无规则数据", "info");
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
  try {
    loading.syncMcp = true;
    addSyncLog("开始同步MCP配置...", "info");

    // 检查登录状态
    if (!userInfo.value.isLoggedIn || !userInfo.value.email) {
      message.warning("请先登录账户");
      return;
    }

    // 检查MCP配置
    if (!mcpServers.value || mcpServers.value.length === 0) {
      message.warning("当前没有MCP配置需要同步");
      return;
    }

    // 格式化MCP数据 - 确保是纯数据对象，避免DataCloneError
    const mcps: McpServerItem[] = mcpServers.value.map((server, index) => {
      // 创建纯数据对象，避免任何可能的函数或不可序列化内容
      const cleanServer: McpServerItem = {
        serverName: String(server.name || ""),
        command: String(server.command || ""),
        args: Array.isArray(server.args)
          ? server.args.map((arg) => String(arg))
          : [],
        env:
          server.env && typeof server.env === "object"
            ? Object.fromEntries(
                Object.entries(server.env).map(([key, value]) => [
                  String(key),
                  String(value),
                ]),
              )
            : {},
        sortOrder: index + 1,
      };
      return cleanServer;
    });

    console.log("🔍 清理后的MCP数据:", mcps);

    // 调用API同步MCP配置
    const result = await mcpApi.syncMcpServers(mcps);

    if (result.success) {
      message.success("MCP配置同步成功");
      addSyncLog("MCP配置同步成功", "success");
    } else {
      message.error(result.message || "MCP配置同步失败");
      addSyncLog(`MCP配置同步失败: ${result.message}`, "error");
    }
  } catch (error) {
    console.error("同步MCP配置失败:", error);
    message.error(`同步MCP配置失败: ${error}`);
    addSyncLog(`同步MCP配置失败: ${error}`, "error");
  } finally {
    loading.syncMcp = false;
  }
};

/**
 * 从云端下载MCP配置
 */
const handleSyncMcpFromCloud = async () => {
  // 检查登录状态 - 使用userInfo对象而不是localStorage
  if (
    !userInfo.value.isLoggedIn ||
    !userInfo.value.token ||
    !userInfo.value.email
  ) {
    addSyncLog("用户未登录，无法下载MCP配置", "error");
    return;
  }

  loading.syncMcp = true;
  addSyncLog("开始从服务端下载MCP配置...", "info");

  try {
    // 1. 从服务端获取MCP配置
    const result = await mcpService.getMcpServers();

    if (result.success && "data" in result && result.data) {
      const responseData = result.data as CloudMcpResponse;
      const cloudMcps = responseData.mcps;

      if (cloudMcps && cloudMcps.length > 0) {
        // 2. 转换为本地格式
        const mcpConfig: Record<string, McpConfig> = {};
        cloudMcps.forEach((mcp) => {
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

        addSyncLog("MCP配置从服务端下载成功", "success");
        syncInfo.mcpStatus = "synced";
      } else {
        addTestLog("服务端无MCP配置数据", "info");
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

/**
 * 解码JWT token以便调试
 */
const decodeJWT = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { error: "Invalid JWT format" };
    }

    // 解码payload (第二部分)
    const payload = parts[1];
    // 添加必要的padding
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decodedPayload = atob(paddedPayload);
    const parsedPayload = JSON.parse(decodedPayload);

    return {
      header: JSON.parse(
        atob(parts[0] + "=".repeat((4 - (parts[0].length % 4)) % 4)),
      ),
      payload: parsedPayload,
      signature: parts[2],
    };
  } catch (error) {
    return { error: `JWT decode failed: ${error}` };
  }
};

/**
 * 简单的JWT解码函数
 */
const jwt_decode = (token: string) => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format");
    }
    const payload = parts[1];
    const paddedPayload = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(paddedPayload));
  } catch (error) {
    throw new Error(`JWT decode failed: ${error}`);
  }
};

// 初始化函数
onMounted(async () => {
  console.log("🚀 页面初始化开始...");

  // 1. 检查系统状态
  console.log("1️⃣ 检查系统状态");
  checkSystemStatus();

  // 2. 加载用户信息
  console.log("2️⃣ 加载用户信息");
  loadUserInfo();

  // 3. 检查登录状态 - 必须等待完成
  console.log("3️⃣ 检查登录状态");
  await checkCloudLoginStatus();

  console.log("🔍 登录状态检查完成，当前状态:");
  console.log("  - userInfo.isLoggedIn:", userInfo.value.isLoggedIn);
  console.log(
    "  - userInfo.token:",
    userInfo.value.token
      ? `${userInfo.value.token.substring(0, 20)}...`
      : "null",
  );

  // 4. 加载规则和MCP配置 - 在登录状态确定后执行
  console.log("4️⃣ 加载规则和MCP配置");
  await Promise.all([loadRules(), loadMcpServers()]);

  console.log("✅ 页面初始化完成");
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
