<template>
  <div class="quick-chat">
    <a-card title="Cursor Chat 集成" size="small" class="section-card">
      <div class="chat-section">
        <a-space direction="vertical" style="width: 100%">
          <div class="chat-input">
            <a-textarea
              :value="props.chatMessage"
              @update:value="$emit('update:chatMessage', $event)"
              placeholder="输入要发送到 Cursor Chat 的消息..."
              :rows="8"
              show-count
              :maxlength="2000"
            />
          </div>

          <div class="chat-actions">
            <a-space>
              <a-button
                type="primary"
                @click="$emit('sendToChat')"
                :loading="props.loading.chat"
              >
                <template #icon><MessageOutlined /></template>
                发送到 Chat
              </a-button>
              <a-button
                @click="$emit('openChat')"
                :loading="props.loading.openChat"
              >
                <template #icon><CommentOutlined /></template>
                打开 Chat
              </a-button>
            </a-space>
          </div>

          <div class="chat-help">
            <a-alert
              message="聊天功能说明"
              description="点击'发送到 Chat'会尝试自动打开 Cursor 聊天界面并发送消息。如果自动发送失败，消息会被复制到剪贴板，您可以手动粘贴到聊天界面。"
              type="info"
              show-icon
              closable
            />
          </div>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { CommentOutlined, MessageOutlined } from "@ant-design/icons-vue";

interface Props {
  chatMessage: string;
  loading: {
    chat: boolean;
    openChat: boolean;
    openCursor: boolean;
  };
}

const props = defineProps<Props>();

defineEmits<{
  sendToChat: [];
  openChat: [];
  openCursor: [];
  "update:chatMessage": [value: string];
}>();
</script>

<style scoped>
.quick-chat {
  width: 100%;
}

.section-card {
  margin-bottom: 16px;
}

.chat-section {
  width: 100%;
}

.chat-input {
  margin-bottom: 16px;
}

.chat-actions {
  margin-bottom: 16px;
}

.chat-help {
  margin-top: 16px;
}
</style>
