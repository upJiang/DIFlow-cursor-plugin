import { commands, ExtensionContext } from "vscode";

export const registerCreateSetting = (context: ExtensionContext) => {
  context.subscriptions.push(
    commands.registerCommand("DiFlow.openSetting", () => {
      // 打开插件设置
      commands.executeCommand("workbench.action.openSettings", "DiFlow");
    }),
  );
};
