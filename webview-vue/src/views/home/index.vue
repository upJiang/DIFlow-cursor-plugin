<template>
  <div class="home-container">
    <h1>欢迎使用 DIFlow</h1>
    <p>这是一个 VS Code 插件的 Webview 页面</p>
    <div class="feature-list">
      <h3>功能列表：</h3>
      <ul>
        <li>创建代码片段</li>
        <li>ChatGPT 对话</li>
        <li>代码解释</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup></script>

<style scoped>
.home-container {
  padding: 20px;
  color: white;
  text-align: center;
}

.home-container h1 {
  color: #4CAF50;
  margin-bottom: 20px;
}

.home-container p {
  font-size: 16px;
  margin-bottom: 30px;
  color: #ccc;
}

.feature-list {
  text-align: left;
  max-width: 300px;
  margin: 0 auto;
}

.feature-list h3 {
  color: #2196F3;
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
</style>
