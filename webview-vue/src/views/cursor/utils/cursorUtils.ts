import { sendTaskToVscode } from "../../../utils/vscodeUtils";

// 添加类型定义
interface LoadingState {
  system: boolean;
  user: boolean;
  sync: boolean;
  rules: boolean;
  mcp: boolean;
  test: boolean;
  // BasicInfo 组件需要的属性
  status: boolean;
  userInfo: boolean;
  syncToCloud: boolean;
  // RulesManagement 组件需要的属性
  load: boolean;
  save: boolean;
  clear: boolean;
  // CloudSync 组件需要的属性
  login: boolean;
  logout: boolean;
  syncAll: boolean;
  syncRules: boolean;
  syncMcp: boolean;
  // QuickChat 组件需要的属性
  chat: boolean;
  openChat: boolean;
  openCursor: boolean;
}

interface SystemInfo {
  platform: string;
  version: string;
  isLoggedIn: boolean;
  cursorPath: string;
  configPath: string;
  // BasicInfo 组件需要的属性
  mcpPath: string;
  rulesPath: string;
  cliPath: string;
}

interface UserInfo {
  email: string;
  username: string;
  cursorUserId: string;
  avatar: string;
  isLoggedIn: boolean;
  // CloudSync 组件需要的属性
  token: string;
}

interface LogItem {
  time: Date;
  message: string;
  type: "info" | "success" | "error";
}

// 声明全局vscode接口
declare global {
  interface Window {
    vscode: {
      postMessage: (message: unknown) => Promise<unknown>;
    };
  }
}

/**
 * 获取平台名称
 */
export const getPlatformName = (platform: string) => {
  const platformMap: Record<string, string> = {
    darwin: "macOS",
    win32: "Windows",
    linux: "Linux",
  };
  return platformMap[platform] || platform;
};

/**
 * 创建日志添加函数
 * @param logs 日志数组引用
 * @param maxLogs 最大日志数量
 * @returns 日志添加函数
 */
export const createLogAdder = (
  logs: {
    value: LogItem[];
  },
  maxLogs: number = 100,
) => {
  return (message: string, type: "info" | "success" | "error") => {
    const log: LogItem = {
      time: new Date(),
      message,
      type,
    };
    logs.value.unshift(log);

    // 保持最大日志数量
    if (logs.value.length > maxLogs) {
      logs.value = logs.value.slice(0, maxLogs);
    }
  };
};

/**
 * 处理API调用
 * @param apiCall API调用函数
 * @param successMessage 成功消息
 * @param errorMessage 错误消息
 * @returns API调用结果
 */
export const handleApiCall = async (
  apiCall: () => Promise<unknown>,
  successMessage: string,
  errorMessage: string,
): Promise<{ success?: boolean; message?: string; data?: unknown } | null> => {
  try {
    const result = (await apiCall()) as {
      success?: boolean;
      message?: string;
      data?: unknown;
    };

    if (result?.success) {
      // 这里可以添加成功处理逻辑
      return result;
    } else {
      // 这里可以添加错误处理逻辑
      return result;
    }
  } catch (error) {
    console.error(errorMessage, error);
    return null;
  }
};

/**
 * 创建初始状态数据
 */
export const createInitialState = () => ({
  systemInfo: {
    platform: "",
    version: "",
    isLoggedIn: false,
    cursorPath: "",
    configPath: "",
    mcpPath: "",
    rulesPath: "",
    cliPath: "",
  },
  userInfo: {
    email: "",
    username: "",
    cursorUserId: "",
    avatar: "",
    isLoggedIn: false,
    token: "",
  },
  syncInfo: {
    lastSyncTime: null as Date | null,
    syncStatus: "未同步",
    autoSync: false,
    rulesStatus: "unknown",
    mcpStatus: "unknown",
  },
  loading: {
    system: false,
    user: false,
    sync: false,
    rules: false,
    mcp: false,
    test: false,
    status: false,
    userInfo: false,
    syncToCloud: false,
    load: false,
    save: false,
    clear: false,
    login: false,
    logout: false,
    syncAll: false,
    syncRules: false,
    syncMcp: false,
    chat: false,
    openChat: false,
    openCursor: false,
  },
  syncLogs: [] as LogItem[],
  testLogs: [] as LogItem[],
});

/**
 * 创建标签页配置
 */
export const createTabItems = () => [
  { key: "basic", tab: "基础信息", icon: "InfoCircleOutlined" },
  { key: "rules", tab: "规则管理", icon: "FileTextOutlined" },
  { key: "mcp", tab: "MCP 管理", icon: "ApiOutlined" },
  { key: "sync", tab: "云端同步", icon: "CloudSyncOutlined" },
  { key: "chat", tab: "快捷对话", icon: "MessageOutlined" },
  { key: "test", tab: "服务器测试", icon: "ExperimentOutlined" },
];

/**
 * 处理系统信息检查
 */
export const handleSystemCheck = async (
  loading: LoadingState,
  systemInfo: SystemInfo,
  addTestLog: (message: string, type: "info" | "success" | "error") => void,
) => {
  loading.system = true;
  addTestLog("开始检查系统信息...", "info");

  try {
    const result = await sendTaskToVscode("getSystemInfo");
    Object.assign(systemInfo, result);
    addTestLog("系统信息检查完成", "success");
  } catch (error) {
    addTestLog(`系统信息检查错误: ${error}`, "error");
  } finally {
    loading.system = false;
  }
};

/**
 * 处理用户信息加载
 */
export const handleUserInfoLoad = async (
  loading: LoadingState,
  userInfo: UserInfo,
  addTestLog: (message: string, type: "info" | "success" | "error") => void,
) => {
  loading.user = true;
  addTestLog("开始加载用户信息...", "info");

  try {
    const result = await sendTaskToVscode("getCursorUserInfo");
    Object.assign(userInfo, result);
    addTestLog("用户信息加载完成", "success");
  } catch (error) {
    addTestLog(`用户信息加载错误: ${error}`, "error");
  } finally {
    loading.user = false;
  }
};
