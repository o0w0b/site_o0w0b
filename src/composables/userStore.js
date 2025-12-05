import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('userStore', () => {
  const curtainStyle = ref({
    backgroundImage: `url('/img/Event_Main_Stage_Bg.png')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  })

  const videoSrc = ref('/videos/transfrom.webm')

  // 最大 AP 值
  const maxAp = computed(() => 2400)

  // 有关 BGM 的配置
  const fadeMS = computed(() => 2000)  // 淡入淡出总时长（毫秒）
  const targetVol = computed(() => 0.3)  // BGM 目标音量

  /**
   * 切换背景图（蓝 / 紫）
   */
  function changeBackground() {
    const images = [
      '/img/Event_Main_Stage_Bg_Purple.png',
      '/img/Event_Main_Stage_Bg.png'
    ]
    const videos = [
      '/videos/transfrom_Purple.webm',
      '/videos/transfrom.webm'
    ]
    const idx = Math.floor(Math.random() * images.length)
    curtainStyle.value.backgroundImage = `url(${images[idx]})`
    videoSrc.value = videos[idx]
  }

  return {
    curtainStyle,
    videoSrc,
    maxAp,
    fadeMS,
    targetVol,
    changeBackground
  }
})