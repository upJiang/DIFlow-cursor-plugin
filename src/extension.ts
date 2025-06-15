import * as vscode from "vscode";
import { registerCreateScript } from "./commands/createScript";
import { registerCreateSnippets } from "./commands/createSnippets";
import { registerCreateSetting } from "./commands/createSetting";
import { registerCreateChatGPTView } from "./commands/createChatGPTView";
import {
  registerCursorIntegration,
  registerCursorManagement,
} from "./commands/cursorIntegration";

export function activate(context: vscode.ExtensionContext) {
  // 注册各种命令
  registerCreateScript(context);
  registerCreateSnippets(context);
  registerCreateSetting(context);
  registerCreateChatGPTView(context);

  // 注册 Cursor 集成
  registerCursorIntegration(context);
  registerCursorManagement(context);
}

export function deactivate() {}
