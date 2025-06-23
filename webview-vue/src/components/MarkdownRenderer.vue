<template>
  <div class="markdown-renderer">
    <div class="markdown-header" v-if="showHeader">
      <div class="markdown-title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="markdown-actions">
        <a-button
          size="small"
          type="text"
          @click="copyContent"
          :loading="copying"
        >
          <template #icon>
            <CopyOutlined v-if="!copied" />
            <CheckOutlined v-else style="color: #52c41a" />
          </template>
          {{ copied ? "已复制" : "复制" }}
        </a-button>
      </div>
    </div>
    <div
      class="markdown-content"
      v-html="renderedContent"
      :class="{ 'with-header': showHeader }"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { CheckOutlined, CopyOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import MarkdownIt from "markdown-it";
import { computed, ref } from "vue";

/**
 * Markdown 渲染器组件属性
 */
interface Props {
  /** Markdown 内容 */
  content: string;
  /** 是否显示头部 */
  showHeader?: boolean;
  /** 标题 */
  title?: string;
  /** 是否启用代码高亮 */
  highlight?: boolean;
  /** 是否启用代码复制 */
  enableCodeCopy?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  content: "",
  showHeader: true,
  title: "",
  highlight: true,
  enableCodeCopy: true,
});

// 响应式状态
const copying = ref(false);
const copied = ref(false);

// 初始化 Markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
});

// 尝试配置代码高亮和复制功能
try {
  if (props.highlight) {
    // 动态导入 highlightjs 插件
    import("markdown-it-highlightjs")
      .then((highlightjsModule) => {
        const highlightjs = highlightjsModule.default || highlightjsModule;
        md.use(highlightjs, {
          auto: true,
          code: true,
        });
      })
      .catch((error) => {
        console.warn("代码高亮插件加载失败:", error);
      });
  }

  if (props.enableCodeCopy) {
    // 动态导入代码复制插件
    import("markdown-it-code-copy")
      .then((codeCopyModule) => {
        const codeCopy = codeCopyModule.default || codeCopyModule;
        md.use(codeCopy, {
          iconStyle: "font-size: 14px; opacity: 0.7;",
          iconClass: "code-copy-icon",
          buttonStyle:
            "position: absolute; top: 8px; right: 8px; cursor: pointer;",
          buttonClass: "code-copy-btn",
        });
      })
      .catch((error) => {
        console.warn("代码复制插件加载失败:", error);
      });
  }
} catch (error) {
  console.warn("Markdown 插件配置失败:", error);
}

/**
 * 渲染 Markdown 内容
 */
const renderedContent = computed(() => {
  if (!props.content) return "";
  try {
    return md.render(props.content);
  } catch (error) {
    console.error("Markdown 渲染失败:", error);
    return `<pre>${props.content}</pre>`;
  }
});

/**
 * 复制内容到剪贴板
 */
const copyContent = async () => {
  if (!props.content) return;

  copying.value = true;
  try {
    await navigator.clipboard.writeText(props.content);
    copied.value = true;
    message.success("内容已复制到剪贴板");

    // 2秒后重置复制状态
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error("复制失败:", error);
    message.error("复制失败");
  } finally {
    copying.value = false;
  }
};
</script>

<style scoped>
.markdown-renderer {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.markdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}

.markdown-title {
  font-weight: 500;
  color: #262626;
}

.markdown-actions {
  display: flex;
  gap: 8px;
}

.markdown-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.markdown-content.with-header {
  border-top: none;
}

/* Markdown 内容样式 */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin: 16px 0 8px 0;
  font-weight: 600;
  line-height: 1.4;
}

.markdown-content :deep(h1) {
  font-size: 1.5em;
  color: #1890ff;
  border-bottom: 2px solid #e8e8e8;
  padding-bottom: 8px;
}

.markdown-content :deep(h2) {
  font-size: 1.3em;
  color: #262626;
}

.markdown-content :deep(h3) {
  font-size: 1.1em;
  color: #595959;
}

.markdown-content :deep(p) {
  margin: 8px 0;
  line-height: 1.6;
  color: #262626;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.markdown-content :deep(li) {
  margin: 4px 0;
  line-height: 1.5;
}

.markdown-content :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: "Courier New", monospace;
  font-size: 0.9em;
  color: #d63384;
}

.markdown-content :deep(pre) {
  position: relative;
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  padding: 16px;
  margin: 16px 0;
  overflow-x: auto;
  font-family: "Courier New", monospace;
  font-size: 14px;
  line-height: 1.45;
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
  border-radius: 0;
  color: inherit;
}

.markdown-content :deep(blockquote) {
  margin: 16px 0;
  padding: 8px 16px;
  border-left: 4px solid #1890ff;
  background: #f0f9ff;
  color: #262626;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #e8e8e8;
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(th) {
  background: #fafafa;
  font-weight: 600;
}

.markdown-content :deep(a) {
  color: #1890ff;
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #262626;
}

.markdown-content :deep(em) {
  font-style: italic;
  color: #595959;
}

/* 代码复制按钮样式 */
.markdown-content :deep(.code-copy-btn) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  transition: all 0.2s;
}

.markdown-content :deep(.code-copy-btn:hover) {
  background: #fff;
  border-color: #1890ff;
  color: #1890ff;
}

/* 滚动条样式 */
.markdown-content::-webkit-scrollbar {
  width: 6px;
}

.markdown-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.markdown-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.markdown-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
