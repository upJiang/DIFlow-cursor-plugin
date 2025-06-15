<template>
  <div class="home-container">
    <h1>欢迎使用 DIFlow</h1>
    <p>这是一个 VS Code 插件的 Webview 页面</p>

    <div class="navigation">
      <h3>功能导航：</h3>
      <div class="nav-buttons">
        <button @click="openCursorManagement" class="nav-button">
          <div class="nav-icon">⚙️</div>
          <div class="nav-text">
            <h4>Cursor 管理</h4>
            <p>管理 Cursor 规则和 MCP 配置</p>
          </div>
        </button>

        <router-link to="/snippets" class="nav-button">
          <div class="nav-icon">📝</div>
          <div class="nav-text">
            <h4>代码片段</h4>
            <p>创建和管理代码片段</p>
          </div>
        </router-link>

        <router-link to="/chatgpt" class="nav-button">
          <div class="nav-icon">💬</div>
          <div class="nav-text">
            <h4>ChatGPT 对话</h4>
            <p>与 AI 助手进行对话</p>
          </div>
        </router-link>
      </div>
    </div>

    <div class="feature-list">
      <h3>功能列表：</h3>
      <ul>
        <li>创建代码片段</li>
        <li>ChatGPT 对话</li>
        <li>代码解释</li>
        <li>Cursor 集成管理</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
declare const vscode: any;

/**
 * 打开 Cursor 管理页面
 * 通过调用 VSCode 命令打开新的 webview 窗口
 */
const openCursorManagement = () => {
  vscode.postMessage({
    command: "DiFlow.cursorManagement",
  });
};
</script>

<style scoped>
.home-container {
  padding: 20px;
  color: white;
  text-align: center;
}

.home-container h1 {
  color: #4caf50;
  margin-bottom: 20px;
}

.home-container p {
  font-size: 16px;
  margin-bottom: 30px;
  color: #ccc;
}

.navigation {
  margin-bottom: 40px;
}

.navigation h3 {
  color: #2196f3;
  margin-bottom: 20px;
}

.nav-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.nav-button {
  display: flex;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  text-decoration: none;
  color: white;
  min-width: 200px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.nav-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  color: white;
}

.nav-icon {
  font-size: 24px;
  margin-right: 12px;
}

.nav-text h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.nav-text p {
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
}

.feature-list {
  text-align: left;
  max-width: 300px;
  margin: 0 auto;
}

.feature-list h3 {
  color: #2196f3;
  margin-bottom: 15px;
}

.feature-list ul {
  list-style-type: none;
  padding: 0;
}

.feature-list li {
  padding: 8px 0;
  border-bottom: 1px solid #333;
  color: #ddd;
}

.feature-list li:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .nav-buttons {
    flex-direction: column;
    align-items: center;
  }

  .nav-button {
    width: 100%;
    max-width: 300px;
  }
}
</style>
