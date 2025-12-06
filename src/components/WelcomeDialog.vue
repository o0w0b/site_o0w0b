<script setup>
import { ref, onMounted } from 'vue'

const welcomeDialogVisible = ref(false)
const dontShowWelcomeDialogCheckBox = ref(false)

onMounted(() => {
  // 弹出欢迎信息
  const dontShowWelcomeDialogFlag = localStorage.getItem('dontShowWelcomeDialogFlag')
  if (!dontShowWelcomeDialogFlag) {
    welcomeDialogVisible.value = true
  }
})

/*
  记录用户选择是否显示欢迎信息弹窗
 */
const setDontShowWelcomeDialogFlag = () => {
  if (dontShowWelcomeDialogCheckBox.value) {
    localStorage.setItem('dontShowWelcomeDialogFlag', true)
  }
}
</script>

<template>
  <!--访问本站的弹窗-->
  <a-modal
    v-model:visible="welcomeDialogVisible"
    @close="setDontShowWelcomeDialogFlag"
    modal-animation-name="no-slide-zoom-modal"
    :mask-closable="false"
    :footer="false"
  >
    <template #title> Welcome </template>
    <div class="blue-text-color">
      <p>欢迎光临！ (`・ω・´)✧</p>
      <br />
      <p>
        本站由
        <a
          href="https://o0w0b.top"
          target="_blank"
          style="color: #3987ff; font-weight: 700"
          >o0w0b</a
        >
        创建与维护
      </p>
      <p></p>
      <p></p>
      <br />
      <p>⚠ 本站与《蔚蓝档案》官方无任何关联，请知悉</p>
      <br />
      <a-checkbox
        v-model="dontShowWelcomeDialogCheckBox"
        class="welcome-checkbox"
      >
        <span class="welcome-checkbox-text">下次不再显示</span>
      </a-checkbox>

    </div>
  </a-modal>
</template>

<style scoped></style>
