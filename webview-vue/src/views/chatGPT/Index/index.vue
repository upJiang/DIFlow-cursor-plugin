<template>
  <div class="chat-container">
    <div class="messages-container" ref="scrollContainer">
      <div class="empty-item"></div>
      <div
        :class="['message-item', item.role]"
        v-for="item in model.messageList.value"
        :key="item.content"
      >
        <CodeDisplay :answer="item.content" />
        <span class="time">{{ item.time }}</span>
      </div>
      <div class="loading-container" v-if="model.loading.value">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    </div>
    <div class="input-container">
      <a-input
        v-model:value="model.userInput.value"
        class="user-input"
        placeholder="请输入您的问题"
        @keyup.enter="presenter.sendMessageEnter"
      />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { nextTick, ref, watch } from "vue";

import CodeDisplay from "../components/CodeDisplay.vue";
import { usePresenter } from "./presenter";

const presenter = usePresenter();
const { model } = presenter;

const scrollContainer = ref();

watch(
  () => [model.messageList.value, model.loading.value],
  () => {
    nextTick(() => {
      scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
    });
  },
  {
    deep: true,
  },
);
</script>
<style scoped lang="scss">
@import url("./index.scss");
</style>
<style>
@import url("./index.scss");

.dot {
  width: 12px;
  height: 12px;
  margin: 0 5px;

  opacity: 0;
  background-color: #fff;
  border-radius: 50%;

  animation: fadeIn 1.6s forwards infinite;
}
</style>
