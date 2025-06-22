import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";
import { commands, ExtensionContext } from "vscode";
import { showWebView } from "../utils/webviewUtils";

export interface CursorSettings {
  rules?: string; // .cursorrules 文件内容
  generalConfig?: {
    [key: string]: unknown; // Cursor settings.json 的所有配置
  };
  mcpConfig?: {
    mcpServers?: Record<string, McpServerConfig>;
  };
}

/**
 * MCP 服务器配置接口
 */
export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * 动态配置检测结果
 */
interface ConfigPaths {
  settingsPath?: string;
  mcpPath?: string;
  rulesPath?: string;
  cliPath?: string;
  customInstallPath?: string; // 用户自定义安装路径
}

/**
 * 用户信息接口
 */
interface UserInfo {
  isLoggedIn: boolean;
  email?: string;
  username?: string;
  cursorUserId?: string;
  avatar?: string;
  membershipType?: string;
  token?: string;
}

/**
 * 系统信息接口
 */
interface SystemInfo {
  platform: string;
  version: string;
  isLoggedIn: boolean;
  cursorPath: string;
  configPath: string;
  mcpPath: string;
  rulesPath: string;
  cliPath: string;
}

/**
 * Cursor 集成类 - 动态配置版本
 */
export class CursorIntegration {
  private configPaths: ConfigPaths = {};
  private platform: string;
  private logger = {
    debug: (message: string, ...args: any[]) =>
      console.log(`[DEBUG] ${message}`, ...args),
    warn: (message: string, ...args: any[]) =>
      console.warn(`[WARN] ${message}`, ...args),
    error: (message: string, ...args: any[]) =>
      console.error(`[ERROR] ${message}`, ...args),
  };

  constructor() {
    this.platform = os.platform();
    this.detectConfigPaths();
  }

  /**
   * 设置用户自定义 Cursor 安装路径
   */
  setCustomInstallPath(customPath: string): void {
    console.log("设置自定义 Cursor 安装路径:", customPath);
    this.configPaths.customInstallPath = customPath;
    // 重新检测配置路径
    this.detectConfigPaths();
  }

  /**
   * 动态检测所有配置路径
   */
  private detectConfigPaths(): void {
    console.log("开始动态检测 Cursor 配置路径...");

    // 检测 settings.json 路径
    this.configPaths.settingsPath = this.findSettingsPath();

    // 检测 MCP 配置路径
    this.configPaths.mcpPath = this.findMcpPath();

    // 检测 .cursorrules 路径
    this.configPaths.rulesPath = this.findRulesPath();

    // 检测 CLI 路径
    this.configPaths.cliPath = this.findCliPath();

    console.log("配置路径检测结果:", this.configPaths);
  }

  /**
   * 查找 Cursor settings.json 文件
   */
  private findSettingsPath(): string | undefined {
    const homeDir = os.homedir();
    const possiblePaths: string[] = [];

    if (this.platform === "win32") {
      possiblePaths.push(
        path.join(
          homeDir,
          "AppData",
          "Roaming",
          "Cursor",
          "User",
          "settings.json"
        ),
        path.join(
          homeDir,
          "AppData",
          "Local",
          "Cursor",
          "User",
          "settings.json"
        )
      );
    } else if (this.platform === "darwin") {
      // macOS 路径 - 确保使用正确的路径
      const macOSPath = path.join(
        homeDir,
        "Library",
        "Application Support",
        "Cursor",
        "User",
        "settings.json"
      );
      possiblePaths.push(macOSPath);
      console.log("macOS 配置文件路径:", macOSPath);
    } else {
      possiblePaths.push(
        path.join(homeDir, ".config", "Cursor", "User", "settings.json"),
        path.join(homeDir, ".cursor", "settings.json")
      );
    }

    for (const settingsPath of possiblePaths) {
      console.log("检查配置文件路径:", settingsPath);
      if (fs.existsSync(settingsPath)) {
        console.log("找到 settings.json:", settingsPath);
        return settingsPath;
      }
    }

    console.log("未找到 settings.json 文件，检查的路径:", possiblePaths);
    return undefined;
  }

  /**
   * 查找 MCP 配置文件
   */
  private findMcpPath(): string | undefined {
    const homeDir = os.homedir();

    // Cursor MCP 配置文件的正确路径
    let cursorMcpPaths: string[] = [];

    if (this.platform === "darwin") {
      // macOS 路径 - 优先查找专门的MCP配置文件
      cursorMcpPaths = [
        path.join(homeDir, ".cursor", "mcp.json"), // 专门的MCP配置文件
        path.join(homeDir, "mcp.json"), // 用户根目录的MCP配置
        path.join(
          homeDir,
          "Library",
          "Application Support",
          "Cursor",
          "User",
          "globalStorage",
          "rooveterinaryinc.cursor-mcp",
          "settings.json"
        ),
        path.join(
          homeDir,
          "Library",
          "Application Support",
          "Cursor",
          "User",
          "settings.json"
        ),
      ];
    } else if (this.platform === "win32") {
      // Windows 路径 - 优先查找专门的MCP配置文件
      cursorMcpPaths = [
        path.join(homeDir, ".cursor", "mcp.json"), // 专门的MCP配置文件
        path.join(homeDir, "mcp.json"), // 用户根目录的MCP配置
        path.join(
          homeDir,
          "AppData",
          "Roaming",
          "Cursor",
          "User",
          "globalStorage",
          "rooveterinaryinc.cursor-mcp",
          "settings.json"
        ),
        path.join(
          homeDir,
          "AppData",
          "Roaming",
          "Cursor",
          "User",
          "settings.json"
        ),
      ];
    } else {
      // Linux 路径 - 优先查找专门的MCP配置文件
      cursorMcpPaths = [
        path.join(homeDir, ".cursor", "mcp.json"), // 专门的MCP配置文件
        path.join(homeDir, "mcp.json"), // 用户根目录的MCP配置
        path.join(
          homeDir,
          ".config",
          "Cursor",
          "User",
          "globalStorage",
          "rooveterinaryinc.cursor-mcp",
          "settings.json"
        ),
        path.join(homeDir, ".config", "Cursor", "User", "settings.json"),
      ];
    }

    console.log("检查 Cursor MCP 配置路径:", cursorMcpPaths);

    for (const mcpPath of cursorMcpPaths) {
      console.log("检查 MCP 路径:", mcpPath);
      if (fs.existsSync(mcpPath)) {
        console.log("找到 MCP 配置文件:", mcpPath);
        return mcpPath;
      }
    }

    // 如果没有找到现有文件，返回专门的MCP配置文件路径作为默认值
    const defaultPath = cursorMcpPaths[0]; // 使用 .cursor/mcp.json 作为默认路径
    console.log("使用默认 MCP 配置路径:", defaultPath);
    return defaultPath;
  }

  /**
   * 查找 .cursorrules 文件
   */
  private findRulesPath(): string | undefined {
    // 优先查找当前工作区的 .cursorrules
    const workspaceRules = path.join(process.cwd(), ".cursorrules");
    if (fs.existsSync(workspaceRules)) {
      console.log("找到工作区 .cursorrules:", workspaceRules);
      return workspaceRules;
    }

    // 查找用户主目录的 .cursorrules
    const homeRules = path.join(os.homedir(), ".cursorrules");
    if (fs.existsSync(homeRules)) {
      console.log("找到用户主目录 .cursorrules:", homeRules);
      return homeRules;
    }

    // 返回工作区路径作为默认值
    console.log("使用默认 .cursorrules 路径:", workspaceRules);
    return workspaceRules;
  }

  /**
   * 查找 Cursor CLI 工具
   */
  private findCliPath(): string | undefined {
    try {
      const { execSync } = require("child_process");

      // 如果用户设置了自定义路径，优先使用
      if (this.configPaths.customInstallPath) {
        const customCliPaths = this.getCliPathsFromInstallDir(
          this.configPaths.customInstallPath
        );
        for (const cliPath of customCliPaths) {
          if (fs.existsSync(cliPath)) {
            console.log("找到自定义路径 CLI:", cliPath);
            return cliPath;
          }
        }
      }

      // 首先尝试 which/where 命令
      try {
        const whichCommand =
          this.platform === "win32" ? "where cursor" : "which cursor";
        const result = execSync(whichCommand, {
          encoding: "utf8",
          timeout: 3000,
        });
        const cliPath = result.trim().split("\n")[0];
        if (cliPath && fs.existsSync(cliPath)) {
          console.log("通过 which/where 找到 CLI:", cliPath);
          return cliPath;
        }
      } catch (error) {
        console.log("which/where 命令未找到 cursor");
      }

      // 平台特定的查找逻辑
      if (this.platform === "darwin") {
        return this.findCliMacOS();
      } else if (this.platform === "win32") {
        return this.findCliWindows();
      } else {
        return this.findCliLinux();
      }
    } catch (error) {
      console.error("查找 CLI 工具时出错:", error);
      return undefined; // 不要返回 "cursor"，因为可能不存在
    }
  }

  /**
   * 从安装目录获取可能的 CLI 路径
   */
  private getCliPathsFromInstallDir(installDir: string): string[] {
    const paths: string[] = [];

    if (this.platform === "darwin") {
      // macOS 应用结构
      if (installDir.endsWith(".app")) {
        paths.push(
          path.join(
            installDir,
            "Contents",
            "Resources",
            "app",
            "bin",
            "cursor"
          ),
          path.join(installDir, "Contents", "MacOS", "Cursor"),
          path.join(installDir, "Contents", "Resources", "cursor")
        );
      } else {
        // 可能是直接指向 CLI 的路径
        paths.push(installDir);
      }
    } else if (this.platform === "win32") {
      // Windows 结构
      if (installDir.endsWith(".exe")) {
        paths.push(installDir);
      } else {
        paths.push(
          path.join(installDir, "Cursor.exe"),
          path.join(installDir, "cursor.exe")
        );
      }
    } else {
      // Linux 结构
      paths.push(installDir, path.join(installDir, "cursor"));
    }

    return paths;
  }

  /**
   * macOS 下查找 CLI
   */
  private findCliMacOS(): string | undefined {
    try {
      const { execSync } = require("child_process");

      // 1. 定义所有需要搜索的应用路径
      const appSearchPaths = [
        "/Applications/Cursor.app",
        path.join(os.homedir(), "Applications", "Cursor.app"),
      ];

      // 2. 使用 mdfind 扩展搜索范围
      try {
        console.log("使用 mdfind 搜索 Cursor 应用...");
        const mdfindResult = execSync(
          'mdfind "kMDItemCFBundleIdentifier == com.todesktop.230313mzl4w4u92" 2>/dev/null',
          { encoding: "utf8", timeout: 5000 }
        ).trim();

        if (mdfindResult) {
          appSearchPaths.push(...mdfindResult.split("\n"));
        }
      } catch (e) {
        console.log("mdfind 查找失败，将继续使用常规路径搜索...");
      }

      // 3. 去重并遍历所有可能的应用路径
      const uniqueAppPaths = [...new Set(appSearchPaths)].filter(Boolean); // 过滤空路径
      console.log("正在搜索以下应用路径:", uniqueAppPaths);

      for (const appPath of uniqueAppPaths) {
        if (appPath && fs.existsSync(appPath)) {
          console.log("找到潜在的 Cursor 应用:", appPath);
          // 定义 CLI 工具在 .app 包内的相对路径
          const cliPath = path.join(
            appPath,
            "Contents",
            "Resources",
            "app",
            "bin",
            "cursor"
          );
          if (fs.existsSync(cliPath)) {
            console.log("成功找到 macOS CLI:", cliPath);
            return cliPath; // **重要: 只返回可执行的 CLI 路径**
          }
        }
      }
    } catch (error) {
      console.error("macOS CLI 查找出错:", error);
    }

    console.log("在 macOS 上未找到任何可执行的 Cursor CLI 工具。");
    return undefined;
  }

  /**
   * Windows 下查找 CLI
   */
  private findCliWindows(): string | undefined {
    const possiblePaths: string[] = [
      path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Programs",
        "cursor",
        "Cursor.exe"
      ),
      path.join("C:", "Program Files", "Cursor", "Cursor.exe"),
      path.join("C:", "Program Files (x86)", "Cursor", "Cursor.exe"),
    ];

    for (const cliPath of possiblePaths) {
      if (fs.existsSync(cliPath)) {
        console.log("找到 Windows CLI:", cliPath);
        return cliPath;
      }
    }

    return undefined;
  }

  /**
   * Linux 下查找 CLI
   */
  private findCliLinux(): string | undefined {
    const possiblePaths: string[] = [
      "/usr/bin/cursor",
      "/usr/local/bin/cursor",
      path.join(os.homedir(), ".local", "bin", "cursor"),
      "/opt/cursor/cursor",
      "/snap/bin/cursor",
    ];

    for (const cliPath of possiblePaths) {
      if (fs.existsSync(cliPath)) {
        console.log("找到 Linux CLI:", cliPath);
        return cliPath;
      }
    }

    return undefined;
  }

  /**
   * 检查 Cursor 是否已安装
   */
  async isCursorInstalled(): Promise<boolean> {
    try {
      console.log("=== Cursor 安装检测开始 ===");
      this.detectConfigPaths(); // 确保所有路径都是最新的

      // 强制检测步骤: 基于实际测试的路径直接检查
      console.log("=== 强制检测步骤 ===");
      const forceCheckPaths = {
        app: "/Applications/Cursor.app",
        cli: "/Applications/Cursor.app/Contents/Resources/app/bin/cursor",
        settings: path.join(
          os.homedir(),
          "Library",
          "Application Support",
          "Cursor",
          "User",
          "settings.json"
        ),
      };

      let forceDetected = false;
      console.log("强制检测路径:", forceCheckPaths);

      // 检查应用是否存在
      if (fs.existsSync(forceCheckPaths.app)) {
        console.log("✅ 强制检测: 找到 Cursor 应用");
        forceDetected = true;
      }

      // 检查 CLI 是否存在
      if (fs.existsSync(forceCheckPaths.cli)) {
        console.log("✅ 强制检测: 找到 Cursor CLI");
        this.configPaths.cliPath = forceCheckPaths.cli; // 强制设置 CLI 路径
        forceDetected = true;
      }

      // 检查配置文件是否存在
      if (fs.existsSync(forceCheckPaths.settings)) {
        console.log("✅ 强制检测: 找到 Cursor 配置文件");
        this.configPaths.settingsPath = forceCheckPaths.settings; // 强制设置配置路径
        forceDetected = true;
      }

      if (forceDetected) {
        console.log("=== 强制检测成功，Cursor 已安装 ===");
        return true;
      }

      // 检查 1: 是否找到了 CLI 工具
      if (this.configPaths.cliPath && fs.existsSync(this.configPaths.cliPath)) {
        console.log(
          `检测成功: 找到 CLI 工具路径 '${this.configPaths.cliPath}'`
        );
        return true;
      }
      console.log("检测信息: 未能通过 CLI 路径直接确认安装。");

      // 检查 2: 是否找到了关键配置文件
      if (
        this.configPaths.settingsPath &&
        fs.existsSync(this.configPaths.settingsPath)
      ) {
        console.log(
          `检测成功: 找到配置文件路径 '${this.configPaths.settingsPath}'`
        );
        return true;
      }
      console.log("检测信息: 未能通过配置文件确认安装。");

      // 检查 3: 检查应用安装情况（作为后备方案）
      if (this.checkAppInstallation()) {
        console.log(
          "检测成功: 找到了应用安装目录 (但未找到明确的 CLI 或配置文件)。"
        );
        return true;
      }
      console.log("检测信息: 未能通过应用目录确认安装。");

      // 检查 4: 尝试在 PATH 中执行 `cursor --version`
      try {
        const { execSync } = require("child_process");
        execSync("cursor --version", { timeout: 3000, stdio: "ignore" });
        console.log("检测成功: `cursor --version` 命令执行成功。");
        return true;
      } catch (error: any) {
        console.log(
          `检测信息: 'cursor --version' 命令执行失败: ${error.message}`
        );
      }

      console.log("=== Cursor 未检测到 ===");
      return false;
    } catch (error) {
      console.error("检测 Cursor 安装状态时发生意外错误:", error);
      return false;
    }
  }

  /**
   * 检查应用安装情况
   */
  private checkAppInstallation(): boolean {
    try {
      if (this.platform === "darwin") {
        // macOS: 检查 Applications 目录
        const appPaths = [
          "/Applications/Cursor.app",
          path.join(os.homedir(), "Applications", "Cursor.app"),
        ];

        for (const appPath of appPaths) {
          if (fs.existsSync(appPath)) {
            console.log("找到 Cursor 应用:", appPath);
            return true;
          }
        }
      } else if (this.platform === "win32") {
        // Windows: 检查常见安装位置
        const appPaths = [
          path.join(os.homedir(), "AppData", "Local", "Programs", "cursor"),
          path.join("C:", "Program Files", "Cursor"),
          path.join("C:", "Program Files (x86)", "Cursor"),
        ];

        for (const appPath of appPaths) {
          if (fs.existsSync(appPath)) {
            console.log("找到 Cursor 安装目录:", appPath);
            return true;
          }
        }
      } else {
        // Linux: 检查常见位置
        const appPaths = [
          "/opt/cursor",
          "/usr/local/bin/cursor",
          "/usr/bin/cursor",
          path.join(os.homedir(), ".local", "bin", "cursor"),
        ];

        for (const appPath of appPaths) {
          if (fs.existsSync(appPath)) {
            console.log("找到 Cursor 安装:", appPath);
            return true;
          }
        }
      }
    } catch (error) {
      console.error("检查应用安装时出错:", error);
    }

    return false;
  }

  /**
   * 获取 Cursor 设置
   */
  async getCursorSettings(): Promise<CursorSettings> {
    const settings: CursorSettings = {};

    try {
      // 读取 .cursorrules 文件
      if (
        this.configPaths.rulesPath &&
        fs.existsSync(this.configPaths.rulesPath)
      ) {
        settings.rules = fs.readFileSync(this.configPaths.rulesPath, "utf-8");
      } else {
        settings.rules = "";
      }

      // 读取主配置文件
      if (
        this.configPaths.settingsPath &&
        fs.existsSync(this.configPaths.settingsPath)
      ) {
        const configContent = fs.readFileSync(
          this.configPaths.settingsPath,
          "utf-8"
        );
        try {
          settings.generalConfig = JSON.parse(configContent);
        } catch (parseError) {
          console.warn("解析 settings.json 失败:", parseError);
          settings.generalConfig = {};
        }
      } else {
        settings.generalConfig = {};
      }

      // 读取 MCP 配置文件
      if (this.configPaths.mcpPath && fs.existsSync(this.configPaths.mcpPath)) {
        const mcpContent = fs.readFileSync(this.configPaths.mcpPath, "utf-8");
        try {
          settings.mcpConfig = JSON.parse(mcpContent);
        } catch (parseError) {
          console.warn("解析 MCP 配置失败:", parseError);
          settings.mcpConfig = { mcpServers: {} };
        }
      } else {
        settings.mcpConfig = { mcpServers: {} };
      }
    } catch (error) {
      console.error("获取 Cursor 设置失败:", error);
      throw new Error(`获取 Cursor 设置失败: ${error}`);
    }

    return settings;
  }

  /**
   * 更新 Cursor 设置
   */
  async updateCursorSettings(
    settings: Partial<CursorSettings>
  ): Promise<boolean> {
    try {
      // 更新 .cursorrules 文件
      if (settings.rules !== undefined && this.configPaths.rulesPath) {
        // 确保目录存在
        const rulesDir = path.dirname(this.configPaths.rulesPath);
        if (!fs.existsSync(rulesDir)) {
          fs.mkdirSync(rulesDir, { recursive: true });
        }
        fs.writeFileSync(this.configPaths.rulesPath, settings.rules, "utf-8");
      }

      // 更新主配置文件
      if (
        settings.generalConfig !== undefined &&
        this.configPaths.settingsPath
      ) {
        const configDir = path.dirname(this.configPaths.settingsPath);
        if (!fs.existsSync(configDir)) {
          fs.mkdirSync(configDir, { recursive: true });
        }

        let existingConfig = {};
        if (fs.existsSync(this.configPaths.settingsPath)) {
          try {
            const configContent = fs.readFileSync(
              this.configPaths.settingsPath,
              "utf-8"
            );
            existingConfig = JSON.parse(configContent);
          } catch (parseError) {
            console.warn(
              "解析现有 settings.json 失败，将创建新配置:",
              parseError
            );
          }
        }

        const mergedConfig = { ...existingConfig, ...settings.generalConfig };
        fs.writeFileSync(
          this.configPaths.settingsPath,
          JSON.stringify(mergedConfig, null, 2),
          "utf-8"
        );
      }

      // 更新 MCP 配置文件
      if (settings.mcpConfig !== undefined && this.configPaths.mcpPath) {
        const mcpDir = path.dirname(this.configPaths.mcpPath);
        if (!fs.existsSync(mcpDir)) {
          fs.mkdirSync(mcpDir, { recursive: true });
        }

        let existingMcpConfig = { mcpServers: {} };
        if (fs.existsSync(this.configPaths.mcpPath)) {
          try {
            const mcpContent = fs.readFileSync(
              this.configPaths.mcpPath,
              "utf-8"
            );
            existingMcpConfig = JSON.parse(mcpContent);
          } catch (parseError) {
            console.warn("解析现有 MCP 配置失败，将创建新配置:", parseError);
          }
        }

        const mergedMcpConfig = {
          ...existingMcpConfig,
          ...settings.mcpConfig,
          mcpServers: {
            ...existingMcpConfig.mcpServers,
            ...settings.mcpConfig.mcpServers,
          },
        };

        fs.writeFileSync(
          this.configPaths.mcpPath,
          JSON.stringify(mergedMcpConfig, null, 2),
          "utf-8"
        );
      }

      return true;
    } catch (error) {
      console.error("更新 Cursor 设置失败:", error);
      throw new Error(`更新 Cursor 设置失败: ${error}`);
    }
  }

  /**
   * 打开 Cursor 应用程序
   */
  async openCursor(filePath?: string): Promise<boolean> {
    try {
      const { exec } = require("child_process");

      let command: string;

      if (this.platform === "darwin") {
        if (filePath) {
          command = `open -a "Cursor" "${filePath}"`;
        } else {
          command = `open -a "Cursor" --new`;
        }
      } else {
        const cliPath = this.configPaths.cliPath || "cursor";
        command = `"${cliPath}"`;
        if (filePath) {
          command += ` "${filePath}"`;
        } else {
          command += " --new-window";
        }
      }

      console.log("执行命令:", command);

      return new Promise((resolve, reject) => {
        exec(command, (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            console.error("打开 Cursor 失败:", error);
            reject(new Error(`打开 Cursor 失败: ${error.message}`));
          } else {
            console.log("Cursor 打开成功");
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error("打开 Cursor 失败:", error);
      throw new Error(`打开 Cursor 失败: ${error}`);
    }
  }

  /**
   * 打开 Cursor Chat 并发送消息
   */
  public async openCursorChat(message?: string): Promise<boolean> {
    this.logger.debug("开始打开 Cursor Chat...");

    try {
      // 如果没有提供消息，提示用户输入
      if (!message) {
        const input = await vscode.window.showInputBox({
          prompt: "请输入要发送到 Cursor Chat 的消息",
          placeHolder: "输入您的问题或请求...",
        });
        if (!input) {
          vscode.window.showInformationMessage("❌ 已取消发送消息");
          return false;
        }
        message = input;
      }

      // 复制消息到剪贴板
      await vscode.env.clipboard.writeText(message);
      this.logger.debug("✅ 消息已复制到剪贴板");

      // 打开聊天界面
      this.logger.debug("正在打开聊天界面...");
      try {
        await vscode.commands.executeCommand("aichat.newchataction");
        this.logger.debug("✅ 成功执行 aichat.newchataction");
      } catch (error) {
        this.logger.warn("⚠️ aichat.newchataction 失败，尝试其他命令");
        try {
          await vscode.commands.executeCommand("workbench.action.chat.open");
          this.logger.debug("✅ 成功执行 workbench.action.chat.open");
        } catch (error2) {
          this.logger.warn(
            "⚠️ workbench.action.chat.open 失败，尝试最后一个命令"
          );
          await vscode.commands.executeCommand("workbench.action.chat.newChat");
          this.logger.debug("✅ 成功执行 workbench.action.chat.newChat");
        }
      }

      // 等待界面加载
      await new Promise((resolve) => setTimeout(resolve, 2500));
      this.logger.debug("⏱️ 等待界面加载完成");

      // 尝试聚焦到聊天输入框
      try {
        await vscode.commands.executeCommand(
          "workbench.action.chat.focusInput"
        );
        this.logger.debug("✅ 成功聚焦到聊天输入框");
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        this.logger.warn("⚠️ 聚焦命令失败，继续执行");
      }

      // 使用优化的系统级方法发送消息
      let messageSent = false;

      if (this.platform === "darwin") {
        // macOS: 使用优化的 AppleScript（不激活应用，避免登录问题）
        this.logger.debug("🎯 使用优化的 AppleScript 方法发送消息");

        try {
          const { exec } = require("child_process");
          const { promisify } = require("util");
          const execAsync = promisify(exec);

          // 优化的 AppleScript - 不强制激活应用，避免会话重置
          const appleScript = `
            tell application "System Events"
              -- 检查 Cursor 是否已经在运行，不强制激活
              if (exists (processes whose name is "Cursor")) then
                -- 直接操作当前活动窗口，不切换应用
                delay 0.3
                
                -- 清空当前输入内容（温和方式）
                key code 0 using {command down} -- Cmd+A 全选
                delay 0.1
                key code 51 -- Delete 键删除内容
                delay 0.1
                
                -- 粘贴消息内容
                key code 9 using {command down} -- Cmd+V 粘贴
                delay 0.3
                
                -- 发送消息：按 Enter 键
                key code 36 -- Enter 键
                delay 0.2
                
              else
                error "Cursor 应用未运行"
              end if
            end tell
          `;

          this.logger.debug("执行优化的 AppleScript 键盘模拟...");
          await execAsync(`osascript -e '${appleScript}'`);

          this.logger.debug("✅ AppleScript 执行完成");
          messageSent = true;
        } catch (error) {
          this.logger.error("❌ AppleScript 执行失败:", error);
          // 如果 AppleScript 失败，回退到 VS Code 命令方法
          messageSent = await this.fallbackSendMethod(message);
        }
      } else if (this.platform === "win32") {
        // Windows: 使用 PowerShell 进行键盘模拟
        this.logger.debug("🎯 使用 PowerShell 方法发送消息（Windows）");

        try {
          const { exec } = require("child_process");
          const { promisify } = require("util");
          const execAsync = promisify(exec);

          // PowerShell 脚本进行键盘模拟
          const powershellScript = `
            Add-Type -AssemblyName System.Windows.Forms
            
            # 等待一下确保焦点正确
            Start-Sleep -Milliseconds 300
            
            # 全选当前内容
            [System.Windows.Forms.SendKeys]::SendWait("^a")
            Start-Sleep -Milliseconds 100
            
            # 删除内容
            [System.Windows.Forms.SendKeys]::SendWait("{DELETE}")
            Start-Sleep -Milliseconds 100
            
            # 粘贴消息
            [System.Windows.Forms.SendKeys]::SendWait("^v")
            Start-Sleep -Milliseconds 300
            
            # 发送消息（Enter 键）
            [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
            Start-Sleep -Milliseconds 200
          `;

          this.logger.debug("执行 PowerShell 键盘模拟...");
          await execAsync(
            `powershell -Command "${powershellScript.replace(/"/g, '\\"')}"`,
            {
              windowsHide: true,
            }
          );

          this.logger.debug("✅ PowerShell 执行完成");
          messageSent = true;
        } catch (error) {
          this.logger.error("❌ PowerShell 执行失败:", error);
          // 如果 PowerShell 失败，回退到 VS Code 命令方法
          messageSent = await this.fallbackSendMethod(message);
        }
      } else {
        // Linux: 使用 xdotool 或回退方法
        this.logger.debug("🎯 使用 Linux 方法发送消息");

        try {
          const { exec } = require("child_process");
          const { promisify } = require("util");
          const execAsync = promisify(exec);

          // 尝试使用 xdotool
          try {
            await execAsync("which xdotool", { timeout: 1000 });

            const xdotoolCommands = [
              "sleep 0.3",
              "xdotool key ctrl+a", // 全选
              "sleep 0.1",
              "xdotool key Delete", // 删除
              "sleep 0.1",
              "xdotool key ctrl+v", // 粘贴
              "sleep 0.3",
              "xdotool key Return", // 回车发送
              "sleep 0.2",
            ].join(" && ");

            this.logger.debug("执行 xdotool 键盘模拟...");
            await execAsync(xdotoolCommands);

            this.logger.debug("✅ xdotool 执行完成");
            messageSent = true;
          } catch (xdotoolError) {
            this.logger.warn("⚠️ xdotool 不可用，使用回退方法");
            messageSent = await this.fallbackSendMethod(message);
          }
        } catch (error) {
          this.logger.error("❌ Linux 方法执行失败:", error);
          messageSent = await this.fallbackSendMethod(message);
        }
      }

      // 等待发送完成
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 验证发送结果
      if (messageSent) {
        vscode.window.showInformationMessage(
          `✅ 消息已发送到 Cursor Chat: "${message}"`
        );
        this.logger.debug("🎉 Cursor Chat 操作完成，消息发送成功");
        return true;
      } else {
        vscode.window.showWarningMessage(
          `⚠️ 自动发送失败，消息已复制到剪贴板，请手动粘贴并发送。消息内容: "${message}"`
        );
        this.logger.debug("⚠️ 自动发送失败，需要手动操作");
        return false;
      }
    } catch (error) {
      this.logger.error("❌ 打开 Cursor Chat 时发生错误:", error);
      vscode.window.showErrorMessage(`❌ 打开 Cursor Chat 失败: ${error}`);
      return false;
    }
  }

  /**
   * 回退发送方法 - 使用 VS Code 命令
   */
  private async fallbackSendMethod(message: string): Promise<boolean> {
    this.logger.debug("🔄 使用回退方法发送消息");

    try {
      // 尝试粘贴消息
      await vscode.commands.executeCommand(
        "editor.action.clipboardPasteAction"
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
      this.logger.debug("✅ 回退方法: 消息粘贴完成");

      // 多次尝试 Enter 键
      for (let i = 0; i < 2; i++) {
        try {
          await vscode.commands.executeCommand("type", { text: "\n" });
          await new Promise((resolve) => setTimeout(resolve, 300));
          this.logger.debug(`✅ 回退方法: Enter 键尝试 ${i + 1} 完成`);
        } catch (error) {
          this.logger.debug(`⚠️ 回退方法: Enter 键尝试 ${i + 1} 失败:`, error);
        }
      }

      this.logger.debug("✅ 回退方法执行完成");
      return true;
    } catch (error) {
      this.logger.error("❌ 回退方法也失败:", error);
      return false;
    }
  }

  /**
   * 获取 MCP 服务器列表
   */
  async getMcpServers(): Promise<Record<string, McpServerConfig>> {
    try {
      // 确保配置路径是最新的
      this.detectConfigPaths();

      const mcpPath = this.configPaths.mcpPath;
      console.log("获取 MCP 服务器 - 使用路径:", mcpPath);

      if (!mcpPath) {
        console.log("MCP 配置路径未找到");
        return {};
      }

      // 如果配置文件不存在，创建一个空的配置文件
      if (!fs.existsSync(mcpPath)) {
        console.log("MCP 配置文件不存在，创建空配置:", mcpPath);
        try {
          // 确保目录存在
          const mcpDir = path.dirname(mcpPath);
          if (!fs.existsSync(mcpDir)) {
            fs.mkdirSync(mcpDir, { recursive: true });
          }

          // 创建空的MCP配置
          const emptyConfig = { mcpServers: {} };
          fs.writeFileSync(
            mcpPath,
            JSON.stringify(emptyConfig, null, 2),
            "utf8"
          );
          console.log("已创建空的 MCP 配置文件");
        } catch (createError) {
          console.error("创建 MCP 配置文件失败:", createError);
        }
        return {};
      }

      const content = fs.readFileSync(mcpPath, "utf8");
      let config: any;

      try {
        config = JSON.parse(content);
      } catch (parseError) {
        console.error("MCP 配置文件 JSON 解析失败:", parseError);
        return {};
      }

      console.log("MCP 配置内容:", config);

      // 处理不同的配置文件格式
      let mcpServers: Record<string, McpServerConfig> = {};

      // 格式1: 直接的 mcpServers 对象
      if (config.mcpServers && typeof config.mcpServers === "object") {
        mcpServers = config.mcpServers;
      }
      // 格式2: 嵌套在其他结构中
      else if (config.mcp && config.mcp.mcpServers) {
        mcpServers = config.mcp.mcpServers;
      }
      // 格式3: 可能是 Cursor settings.json 格式
      else if (config["mcp.mcpServers"]) {
        mcpServers = config["mcp.mcpServers"];
      }
      // 格式4: 直接就是服务器配置对象
      else if (typeof config === "object" && !Array.isArray(config)) {
        // 检查是否所有键都像是服务器配置
        const isServerConfig = Object.values(config).every(
          (value) => value && typeof value === "object" && "command" in value
        );
        if (isServerConfig) {
          mcpServers = config;
        }
      }

      // 过滤掉无效的配置项
      const validServers: Record<string, McpServerConfig> = {};

      for (const [name, serverConfig] of Object.entries(mcpServers)) {
        // 跳过空键名或无效配置
        if (
          !name ||
          name.trim() === "" ||
          !serverConfig ||
          typeof serverConfig !== "object"
        ) {
          console.log("跳过无效的 MCP 服务器配置:", { name, serverConfig });
          continue;
        }

        // 确保配置有必需的字段
        if (!serverConfig.command) {
          console.log("跳过缺少 command 字段的 MCP 服务器:", name);
          continue;
        }

        // 标准化配置格式
        validServers[name] = {
          ...serverConfig, // 先展开原配置
          command: serverConfig.command, // 确保command字段存在
          args: serverConfig.args || [],
          env: serverConfig.env || {},
        };
      }

      console.log("有效的 MCP 服务器配置:", validServers);
      return validServers;
    } catch (error) {
      console.error("Error reading MCP configuration:", error);
      return {};
    }
  }

  /**
   * 添加 MCP 服务器
   */
  async addMcpServer(name: string, config: McpServerConfig): Promise<boolean> {
    try {
      const settings = await this.getCursorSettings();
      if (!settings.mcpConfig) {
        settings.mcpConfig = { mcpServers: {} };
      }
      if (!settings.mcpConfig.mcpServers) {
        settings.mcpConfig.mcpServers = {};
      }

      settings.mcpConfig.mcpServers[name] = config;

      return await this.updateCursorSettings({ mcpConfig: settings.mcpConfig });
    } catch (error) {
      console.error("添加 MCP 服务器失败:", error);
      throw error;
    }
  }

  /**
   * 删除 MCP 服务器
   */
  async removeMcpServer(name: string): Promise<boolean> {
    try {
      const settings = await this.getCursorSettings();
      if (settings.mcpConfig?.mcpServers?.[name]) {
        delete settings.mcpConfig.mcpServers[name];

        if (this.configPaths.mcpPath) {
          const mcpDir = path.dirname(this.configPaths.mcpPath);
          if (!fs.existsSync(mcpDir)) {
            fs.mkdirSync(mcpDir, { recursive: true });
          }

          fs.writeFileSync(
            this.configPaths.mcpPath,
            JSON.stringify(settings.mcpConfig, null, 2),
            "utf-8"
          );
        }

        console.log(`MCP 服务器 ${name} 已删除`);
        return true;
      } else {
        console.log(`MCP 服务器 ${name} 不存在`);
        return true;
      }
    } catch (error) {
      console.error("删除 MCP 服务器失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户规则
   */
  async getUserRules(): Promise<string> {
    try {
      const rulesPath = this.findRulesPath();
      if (!rulesPath || !fs.existsSync(rulesPath)) {
        console.log("Rules file not found:", rulesPath);
        return "";
      }

      const content = fs.readFileSync(rulesPath, "utf8");
      console.log("读取到的规则内容:", content);

      return content;
    } catch (error) {
      console.error("Error reading user rules:", error);
      return "";
    }
  }

  /**
   * 更新用户规则
   */
  async updateUserRules(rules: string): Promise<boolean> {
    try {
      const rulesPath = this.findRulesPath();
      if (!rulesPath) {
        console.error("Rules path not found");
        return false;
      }

      // 确保目录存在
      const rulesDir = path.dirname(rulesPath);
      if (!fs.existsSync(rulesDir)) {
        fs.mkdirSync(rulesDir, { recursive: true });
      }

      // 保存为纯文本格式
      fs.writeFileSync(rulesPath, rules, "utf8");
      console.log("规则已保存到:", rulesPath);

      return true;
    } catch (error) {
      console.error("Error updating user rules:", error);
      return false;
    }
  }

  /**
   * 获取 Cursor 用户信息 - 改进版本，从 SQLite 数据库读取
   */
  async getCursorUserInfo(): Promise<UserInfo> {
    try {
      console.log("=== 开始获取 Cursor 用户信息 ===");

      // 重新检测配置路径
      this.detectConfigPaths();

      // 构建 SQLite 数据库路径
      let dbPath: string;
      if (this.platform === "darwin") {
        dbPath = path.join(
          os.homedir(),
          "Library/Application Support/Cursor/User/globalStorage/state.vscdb"
        );
      } else if (this.platform === "win32") {
        dbPath = path.join(
          os.homedir(),
          "AppData/Roaming/Cursor/User/globalStorage/state.vscdb"
        );
      } else {
        // Linux
        dbPath = path.join(
          os.homedir(),
          ".config/Cursor/User/globalStorage/state.vscdb"
        );
      }

      console.log("SQLite 数据库路径:", dbPath);

      // 检查数据库文件是否存在
      if (!fs.existsSync(dbPath)) {
        console.log("❌ Cursor SQLite 数据库不存在");
        return { isLoggedIn: false };
      }

      console.log("✅ 找到 Cursor SQLite 数据库");

      // 使用 sqlite3 命令行工具读取数据库
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      try {
        // 查询用户认证信息
        const query = `
          SELECT key, value 
          FROM ItemTable 
          WHERE key LIKE 'cursorAuth/%'
        `;

        const { stdout } = await execAsync(`sqlite3 "${dbPath}" "${query}"`, {
          encoding: "utf8",
        });

        console.log("数据库查询结果:", stdout);

        // 解析查询结果
        const lines = stdout.trim().split("\n");
        const authData: Record<string, string> = {};

        for (const line of lines) {
          if (line.includes("|")) {
            const [key, value] = line.split("|", 2);
            if (key && value) {
              authData[key] = value;
            }
          }
        }

        console.log("解析的认证数据:", authData);

        // 提取用户信息
        const email = authData["cursorAuth/cachedEmail"];
        const membershipType = authData["cursorAuth/stripeMembershipType"];
        const accessToken = authData["cursorAuth/accessToken"];
        const refreshToken = authData["cursorAuth/refreshToken"];

        // 检查是否有有效的认证信息
        const isLoggedIn = !!(email && (accessToken || refreshToken));

        console.log("=== 最终检测结果 ===");
        console.log("邮箱:", email || "未找到");
        console.log("会员类型:", membershipType || "未找到");
        console.log("登录状态:", isLoggedIn);

        return {
          isLoggedIn,
          email,
          username: email ? email.split("@")[0] : undefined, // 从邮箱提取用户名
          cursorUserId: email, // 暂时使用邮箱作为用户ID
          avatar: "", // 暂时为空
          membershipType,
          token: accessToken, // 使用访问令牌
        };
      } catch (dbError) {
        console.error("❌ 数据库查询失败:", dbError);

        // 如果 SQLite 查询失败，尝试备用方法：直接读取 settings.json
        console.log("=== 尝试备用方法：读取 settings.json ===");
        return await this.getCursorUserInfoFromSettings();
      }
    } catch (error) {
      console.error("❌ 获取 Cursor 用户信息失败:", error);
      return { isLoggedIn: false };
    }
  }

  /**
   * 从 settings.json 文件获取用户信息的备用方法
   */
  private async getCursorUserInfoFromSettings(): Promise<UserInfo> {
    try {
      console.log("使用备用方法从 settings.json 读取用户信息");

      // 检查 Cursor 设置文件是否存在
      if (
        !this.configPaths.settingsPath ||
        !fs.existsSync(this.configPaths.settingsPath)
      ) {
        console.log("❌ Cursor 设置文件不存在");
        return { isLoggedIn: false };
      }

      console.log("✅ 找到 Cursor 设置文件");

      // 读取设置文件
      const settingsContent = fs.readFileSync(
        this.configPaths.settingsPath,
        "utf-8"
      );

      console.log("设置文件内容长度:", settingsContent.length);

      const settings = JSON.parse(settingsContent) as Record<string, unknown>;

      // 定义所有可能包含用户信息的字段
      const emailFields = [
        "cursor.account.email",
        "account.email",
        "cursor.pro.email",
        "cursor.subscription.email",
        "cursor.session.email",
        "cursor.login.email",
        "cursor.user.email",
        "user.email",
        "email",
        "userEmail",
        "loginEmail",
        "accountEmail",
      ];

      const nameFields = [
        "cursor.account.name",
        "account.name",
        "cursor.pro.name",
        "cursor.subscription.name",
        "cursor.session.name",
        "cursor.login.name",
        "cursor.user.name",
        "user.name",
        "name",
        "userName",
        "loginName",
        "accountName",
        "displayName",
      ];

      let email: string | undefined;
      let name: string | undefined;

      // 1. 直接字段搜索
      for (const field of emailFields) {
        if (settings[field] && typeof settings[field] === "string") {
          console.log(`✅ 在字段 '${field}' 找到邮箱:`, settings[field]);
          email = settings[field] as string;
          break;
        }
      }

      for (const field of nameFields) {
        if (settings[field] && typeof settings[field] === "string") {
          console.log(`✅ 在字段 '${field}' 找到用户名:`, settings[field]);
          name = settings[field] as string;
          break;
        }
      }

      // 2. 深度搜索 - 查找任何包含 @ 符号的字段（可能是邮箱）
      if (!email) {
        console.log("=== 开始深度搜索邮箱 ===");

        const deepSearch = (
          obj: Record<string, unknown>,
          path: string = ""
        ): string | undefined => {
          for (const [key, value] of Object.entries(obj)) {
            const currentPath = path ? `${path}.${key}` : key;

            if (
              typeof value === "string" &&
              value.includes("@") &&
              value.includes(".")
            ) {
              console.log(
                `✅ 深度搜索在 '${currentPath}' 找到可能的邮箱:`,
                value
              );
              return value;
            } else if (
              typeof value === "object" &&
              value !== null &&
              !Array.isArray(value)
            ) {
              const result = deepSearch(
                value as Record<string, unknown>,
                currentPath
              );
              if (result) return result;
            }
          }
          return undefined;
        };

        email = deepSearch(settings);
      }

      console.log("=== 备用方法检测结果 ===");
      console.log("邮箱:", email || "未找到");
      console.log("用户名:", name || "未找到");
      console.log("登录状态:", !!email);

      return {
        isLoggedIn: !!email,
        email,
        username: name,
        cursorUserId: email,
        avatar: "",
        membershipType: "",
        token: "",
      };
    } catch (error) {
      console.error("❌ 备用方法获取用户信息失败:", error);
      return { isLoggedIn: false };
    }
  }

  /**
   * 检查 Cursor 是否已登录
   */
  async isCursorLoggedIn(): Promise<boolean> {
    const userInfo = await this.getCursorUserInfo();
    return userInfo.isLoggedIn;
  }

  /**
   * 获取系统信息
   */
  getSystemInfo(): SystemInfo {
    return {
      platform: this.platform,
      version: process.version,
      isLoggedIn: false,
      cursorPath:
        this.configPaths.customInstallPath ||
        this.configPaths.cliPath ||
        "未找到",
      configPath: this.configPaths.settingsPath || "未找到",
      mcpPath: this.configPaths.mcpPath || "未找到",
      rulesPath: this.configPaths.rulesPath || "未找到",
      cliPath: this.configPaths.cliPath || "未找到",
    };
  }

  /**
   * 获取 MCP 配置 JSON 格式
   * 注意：此方法应该通过 webview 任务处理器调用，不直接在这里实现API调用
   */
  async getMcpConfigJson(): Promise<{
    mcpConfig: Record<string, McpServerConfig>;
  }> {
    try {
      // 直接返回本地配置，API调用应该在webview任务处理器中进行
      const mcpServers = await this.getMcpServers();
      return { mcpConfig: mcpServers };
    } catch (error) {
      console.error("获取 MCP 配置 JSON 失败:", error);
      // 返回空配置而不是抛出错误
      return { mcpConfig: {} };
    }
  }

  /**
   * 批量更新 MCP 配置
   * 注意：此方法应该通过 webview 任务处理器调用，不直接在这里实现API调用
   */
  async batchUpdateMcpConfig(
    mcpConfig: Record<string, McpServerConfig>
  ): Promise<{ count: number }> {
    try {
      const mcpPath = this.configPaths.mcpPath;
      if (!mcpPath) {
        throw new Error("未找到 MCP 配置文件路径");
      }

      // 读取现有配置
      let existingConfig = {};
      if (fs.existsSync(mcpPath)) {
        const configContent = fs.readFileSync(mcpPath, "utf8");
        existingConfig = JSON.parse(configContent);
      }

      // 更新配置
      const updatedConfig = {
        ...existingConfig,
        mcpServers: mcpConfig,
      };

      // 写入文件
      fs.writeFileSync(mcpPath, JSON.stringify(updatedConfig, null, 2), "utf8");

      const count = Object.keys(mcpConfig).length;
      console.log(`成功批量更新 ${count} 个 MCP 配置`);
      return { count };
    } catch (error) {
      console.error("批量更新 MCP 配置失败:", error);
      throw new Error("批量更新 MCP 配置失败");
    }
  }

  /**
   * 分享 MCP 配置
   * 注意：此方法仅用于webview任务处理器，实际API调用在任务处理器中进行
   */
  async shareMcpConfig(
    title: string,
    description?: string,
    mcpConfig?: Record<string, McpServerConfig>
  ): Promise<{ shareId: string }> {
    // 这个方法不应该直接调用，应该通过webview任务处理器
    throw new Error("此方法应该通过webview任务处理器调用");
  }

  /**
   * 通过分享ID获取 MCP 配置
   * 注意：此方法仅用于webview任务处理器，实际API调用在任务处理器中进行
   */
  async getMcpConfigByShareId(shareId: string): Promise<{
    shareId: string;
    title: string;
    description?: string;
    creatorEmail: string;
    usageCount: number;
    mcpConfig: Record<string, McpServerConfig>;
  }> {
    // 这个方法不应该直接调用，应该通过webview任务处理器
    throw new Error("此方法应该通过webview任务处理器调用");
  }

  /**
   * 通过分享ID添加 MCP 配置
   * 注意：此方法仅用于webview任务处理器，实际API调用在任务处理器中进行
   */
  async addMcpByShareId(
    shareId: string
  ): Promise<{ data: { count: number }; message: string }> {
    // 这个方法不应该直接调用，应该通过webview任务处理器
    throw new Error("此方法应该通过webview任务处理器调用");
  }
}

export const registerCursorIntegration = (context: any) => {
  const { commands } = require("vscode");
  const { showWebView } = require("../utils/webviewUtils");

  // 创建 CursorIntegration 实例
  const cursorIntegration = new CursorIntegration();

  context.subscriptions.push(
    commands.registerCommand("DiFlow.getCursorSettings", async () => {
      showWebView(context, {
        key: "main",
        title: "Cursor 管理",
        viewColumn: 1,
        task: { task: "route", data: { path: "/cursor" } },
      });
    }),

    // 添加 openCursorChat 命令注册
    commands.registerCommand(
      "DiFlow.openCursorChat",
      async (message?: string) => {
        try {
          // 如果没有提供消息，提示用户输入
          let chatMessage = message;
          if (!chatMessage) {
            const vscode = require("vscode");
            chatMessage = await vscode.window.showInputBox({
              prompt: "请输入要发送到 Cursor Chat 的消息",
              placeHolder: "输入您的消息...",
            });

            if (!chatMessage) {
              vscode.window.showInformationMessage("已取消发送消息");
              return;
            }
          }

          console.log("发送消息到 Cursor Chat...", { message: chatMessage });

          // 默认启用自动发送功能
          const result = await cursorIntegration.openCursorChat(chatMessage);

          console.log("发送消息到 Cursor Chat 结果:", result);

          if (result) {
            const vscode = require("vscode");
            vscode.window.showInformationMessage("Cursor Chat 操作已完成");
          } else {
            const vscode = require("vscode");
            vscode.window.showWarningMessage(
              "无法完成 Cursor Chat 操作，请确保在 Cursor 环境中运行"
            );
          }
        } catch (error) {
          const vscode = require("vscode");
          vscode.window.showErrorMessage(
            `Cursor Chat 操作失败: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }
    )
  );
};

export const registerCursorManagement = (context: any) => {
  const { commands } = require("vscode");
  const { showWebView } = require("../utils/webviewUtils");

  context.subscriptions.push(
    commands.registerCommand("DiFlow.cursorManagement", async () => {
      showWebView(context, {
        key: "cursor",
        title: "Cursor 管理",
        viewColumn: 1,
        task: { task: "route", data: { path: "/cursor" } },
      });
    })
  );
};
