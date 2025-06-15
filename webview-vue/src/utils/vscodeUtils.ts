/* eslint-disable @typescript-eslint/no-explicit-any */
import router from "@/router";

const callbacks: { [propName: string]: (data: any) => void } = {};
const errorCallbacks: { [propName: string]: (data: any) => void } = {};

export function callVscode(
  data: { cmd: string; data?: any; skipError?: boolean },
  cb?: (data: any) => void,
  errorCb?: (data: any) => void,
) {
  if (!window.vscode) {
    return;
  }
  if (cb) {
    const cbid = `${Date.now()}${Math.round(Math.random() * 100000)}`;
    callbacks[cbid] = cb;
    window.vscode &&
      window.vscode.postMessage({
        ...data,
        cbid,
      });
    if (errorCb) {
      errorCallbacks[cbid] = errorCb;
    }
  } else {
    window.vscode && window.vscode.postMessage(data);
  }
}

// 发送任务到 VSCode 并等待响应
export function sendTaskToVscode(task: string, data?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const cbid = `${Date.now()}${Math.round(Math.random() * 100000)}`;

    // 监听响应
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.cbid === cbid) {
        window.removeEventListener("message", handleMessage);
        if (message.error) {
          reject(new Error(message.error));
        } else {
          resolve(message.data);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // 发送消息
    if (window.vscode) {
      window.vscode.postMessage({
        cmd: task,
        cbid: cbid,
        data: data,
      });
    } else {
      reject(new Error("VSCode API 不可用"));
    }
  });
}

// 初始化
export const initMessageListener = () => {
  window.addEventListener("message", (event) => {
    console.log("监听到信息", event.data);

    const message = event.data;
    switch (message.cmd) {
      case "vscodePushTask":
        if (taskHandler[message.task]) {
          taskHandler[message.task](message.data);
        } else if (message.task === "getCursorSettings") {
          taskHandler.getCursorSettings(message.data);
        } else if (message.task === "updateCursorSettings") {
          taskHandler.updateCursorSettings(message.data);
        } else if (message.task === "openCursorChat") {
          taskHandler.openCursorChat(message.data);
        } else {
          message.error(`未找到名为 ${message.task} 回调方法!`);
        }
        break;
    }
  });
};

// 分发任务
export const taskHandler: {
  [propName: string]: (data: any) => void;
} = {
  // 跳转路由
  route: (data: { path: string; query?: { [key: string]: string } }) => {
    router.replace({
      path: data.path,
      query: data.query,
    });
  },

  // Cursor 设置相关任务
  getCursorSettings: (data: any) => {
    // 获取 Cursor 设置的处理逻辑
    console.log("获取 Cursor 设置:", data);
  },

  updateCursorSettings: (data: any) => {
    // 更新 Cursor 设置的处理逻辑
    console.log("更新 Cursor 设置:", data);
  },

  openCursorChat: (data: any) => {
    // 打开 Cursor 对话的处理逻辑
    console.log("打开 Cursor 对话:", data);
  },
};
