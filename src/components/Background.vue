<script setup>
import { Spine } from '@esotericsoftware/spine-pixi-v7'
import * as PIXI from 'pixi.js'
import { useConfig } from '@/composables/useConfig'
import { useUserStore } from '@/composables/userStore'
import { Howl } from 'howler'
import { ref, computed, onUnmounted } from 'vue'

// 字符串 → 数字（失败会返回0）
const parseRate = s => {
  if (typeof s === 'string') {
    // 1. 先算分数表达式
    if (s.includes('/')) {
      try {
        // 支持 1/8+1/8、1/4-0.1、1-1/3 等
        s = Function('"use strict";return (' + s + ')')()
      } catch {
        return 0
      }
    }
    // 2. 再按百分比处理
    const str = String(s).trim()
    if (str.endsWith('%')) return Number(str.slice(0, -1)) / 100
    return Number(str) || 0
  }
  // 3. 数字就直接用
  return Number(s) || 0
}

const { configs, locale } = useConfig()
const config = configs.value

const userStore = useUserStore()

const emit = defineEmits(['canskip', 'update:changeL2D'])

const props = defineProps(['l2dOnly'])

let animation,
  id = 0
let canSkip = true
let soundList = []
let talking = false,
  talkIndex = 1
let modalRef
const originalOffsetPercent = ref((parseFloat(config.memorialLobbies[0].offset) || 0.7) * 100)

const dialogue = ref('')
const showDialogue = ref(false)
const ifPetting = ref(false)

const bgmUrls = computed(() =>
  configs.value.memorialLobbies.map(item => item.bgm)
)

let curBgm = null // 当前 BGM 实例，组件销毁时一起释放
const loadedBgmUrl = new Set()  // 已经缓存过的地址

const FADE_MS = userStore.fadeMS  // 淡入淡出总时长（毫秒）
const TARGET_VOL = userStore.targetVol // BGM 目标音量

const updateDialoguePos = () => {
  const cfg = config.memorialLobbies[id].dialogueDisplay
  dialogueDisplay.value.x =
    parseRate(cfg.x) * document.documentElement.clientWidth
  dialogueDisplay.value.y =
    parseRate(cfg.y) * document.documentElement.clientHeight
}

window.onresize = () => updateDialoguePos()

const dialogueDisplay = ref({
  x: 0,
  y: 0,
  position: 'left'
})

const l2d = new PIXI.Application({
  width: 2560,
  height: 1440,
  backgroundAlpha: 0
})

document.querySelector('#background').appendChild(l2d.view)

const changeL2D = (value) => {
  emit('update:changeL2D', value)
}

const onEvent = (entry, event) => {
  if (event.stringValue === '') return
  console.log(config.memorialLobbies[id].voice[event.stringValue], event.stringValue)

  if (!config.memorialLobbies[id].voice[event.stringValue]) return

  dialogue.value = config.memorialLobbies[id].voice[event.stringValue]
  showDialogue.value = true
  let voice
  if (locale.value === 'zh') {
    voice = new Howl({
      src: [config.memorialLobbies[id].path + 'zh-CN/' + event.stringValue + '.ogg'],
      volume: 0.3
    })
  } else {
    voice = new Howl({
      src: [config.memorialLobbies[id].path + 'ja-JP/' + event.stringValue + '.ogg'],
      volume: 0.3
    })
  }

  if (voice.state() === 'loaded') voice.play()
  else if (voice.state() === 'loading') {
    voice.on('load', () => {
      voice.play()
    })
  }
  soundList.push(voice)
}

/* ========== 交叉淡入淡出函数 ========== */
const fadeBgm = (newId) => {
  const oldBgm = curBgm
  // 1. 淡出并销毁旧实例
  if (oldBgm) {
    oldBgm.fade(oldBgm.volume(), 0, FADE_MS)   // 音量 → 0
    oldBgm.once('fade', () => {
      oldBgm.stop() // 淡完再 stop
      // 已经加载过的地址就不再 unload，避免缓存被重复删除
      if (!loadedBgmUrl.has(oldBgm._src)) {
        oldBgm.unload()
      }
    })
  }
  // 2. 新歌先静音 → 淡入
  const bgmUrl = bgmUrls.value[newId]
  curBgm = new Howl({
    src: [bgmUrl],
    loop: true,
    volume: 0,
    autoplay: false,
    html5: true
  })
  curBgm.once('load', () => {
    loadedBgmUrl.add(bgmUrl)
    curBgm.play() // 先播放，后调音量
    console.log('[BGM] 播放新歌', newId, '状态', curBgm.state())
    // 确保播放后再淡入
    curBgm.once('play', () => {
      console.log('[BGM] 开始淡入', newId, '音量从', curBgm.volume(), ' → ', TARGET_VOL)
      curBgm.fade(0, TARGET_VOL, FADE_MS) // 0 → 目标音量
      // 监听淡入完成
      curBgm.once('fade', () => {
        console.log('[BGM] 淡入完成，当前音量应为', TARGET_VOL, '实际为', curBgm.volume())
      })
    })
  })
}

const setL2D = async (num) => {
  /* ---------- 最先调用淡入淡出 ---------- */
  let newId
  if (num === '-') {
    newId = id === 0 ? config.memorialLobbies.length - 1 : id - 1
  } else if (num === '+') {
    newId = id === config.memorialLobbies.length - 1 ? 0 : id + 1
  } else {
    newId = num
  }
  fadeBgm(newId)   // 交叉淡入淡出

  canSkip = true
  emit('canskip', true)
  talking = false
  talkIndex = 1
  if (soundList.length !== 0) {
    for (let i in soundList) soundList[i].stop()
    soundList = []
  }
  if (animation) {
    animation.state.listeners = []
    animation.state.addListener({
      event: onEvent
    })
  }
  l2d.stage.removeChild(animation)

  id = newId  // 用 newId 更新 id

  updateDialoguePos()
  dialogueDisplay.value.position = config.memorialLobbies[id].dialogueDisplay.position

  animation = Spine.from('skeleton' + id, 'atlas' + id)
  if (animation) {
    animation.state.setAnimation(1, 'Dummy', true)
    animation.state.setAnimation(2, 'Dummy', true)
    animation.state.setAnimation(3, 'Dummy', true)
    animation.state.setAnimation(4, 'Dummy', true)
  }
  l2d.stage.addChild(animation)
  animation.scale.set(0.85)
  animation.state.setAnimation(0, 'Idle_01', true)
  animation.state.timeScale = 1
  animation.autoUpdate = true
  animation.y = 1440
  animation.x = 2560 / 2

  originalOffsetPercent.value = (parseFloat(config.memorialLobbies[id].offset) || 0.7) * 100
  l2d.view.style.transform = `translateX(calc((50% - ${originalOffsetPercent.value} * 1%) * (1 - min(1, 100vw / 1200px))))`

  let startIdle = 'Start_Idle_01'
  showDialogue.value = false
  if (!animation.state.data.skeletonData.findAnimation('Start_Idle_01')) startIdle = 'Start_idle_01'
  animation.state.addListener({
    event: onEvent
  })
  if (animation.state.data.skeletonData.findAnimation(startIdle)) {
    changeL2D(true)
    animation.state.setAnimation(0, startIdle, false)
    if (
      animation.state.getCurrent(0).animation.name !== 'Idle_01' &&
      animation.state.data.skeletonData.findAnimation('Idle_01')
    ) {
      animation.state.addAnimation(0, 'Idle_01', true)
    }
    let listener = {
      complete: (entry) => {
        if (entry.trackIndex === 0 && entry.animation.name !== 'Idle_01') {
          changeL2D(false)
          animation.state.listeners = []
          animation.state.addListener({
            event: onEvent
          })
          canSkip = false
          emit('canskip', false)
          if (modalRef) {
            modalRef.close()
          }
        }
      }
    }
    animation.state.addListener(listener)
  } else {
    changeL2D(false)
    if (
      animation.state.getCurrent(0).animation.name !== 'Idle_01' &&
      animation.state.data.skeletonData.findAnimation('Idle_01')
    ) {
      animation.state.setAnimation(0, 'Idle_01', true)
      animation.state.listeners = []
      animation.state.addListener({
        event: onEvent
      })
      canSkip = false
      emit('canskip', false)
      if (modalRef) {
        modalRef.close()
      }
    }
  }
}

const skipStartIdle = () => {
  if (
    animation.state.getCurrent(0).animation.name.toLowerCase().startsWith('start_idle')
  ) {
    modalRef = Modal.open({
      title: config.translate.info,
      content: config.translate.ifSkip,
      okText: config.translate.ok,
      cancelText: config.translate.cancel,
      onOk: () => {
        changeL2D(false)
        if (soundList.length !== 0) {
          for (let i in soundList) soundList[i].stop()
          soundList = []
        }
        animation.state.setAnimation(1, 'Dummy', true)
        animation.state.setAnimation(2, 'Dummy', true)
        animation.state.setAnimation(3, 'Dummy', true)
        animation.state.setAnimation(4, 'Dummy', true)
        animation.state.setAnimation(0, 'Idle_01', true)
        animation.state.listeners = []
        animation.state.addListener({
          event: onEvent
        })
        canSkip = false
        emit('canskip', false)
      }
    })
  }
}

const onInteractionWithStudent = () => {
  if (
    talking ||
    animation.state.getCurrent(0).animation.name.toLowerCase().startsWith('start_idle')
  )
    return
  console.log('Talk_0' + talkIndex)
  if (
    animation.state.data.skeletonData.findAnimation('Talk_0' + talkIndex + '_A_CN') &&
    locale.value === 'zh'
  ) {
    animation.state.addAnimation(1, 'Talk_0' + talkIndex + '_A_CN')._mixDuration = 0.3
    animation.state.addAnimation(2, 'Talk_0' + talkIndex + '_M_CN')._mixDuration = 0.3
  } else {
    animation.state.addAnimation(1, 'Talk_0' + talkIndex + '_A')._mixDuration = 0.3
    animation.state.addAnimation(2, 'Talk_0' + talkIndex + '_M')._mixDuration = 0.3
  }
  animation.state.addAnimation(1, 'Dummy', true)._mixDuration = 0.3
  animation.state.addAnimation(2, 'Dummy', true)._mixDuration = 0.3
  let listener = {
    complete: (entry) => {
      if (entry.trackIndex === 1 && entry.animation.name !== 'Dummy') {
        animation.state.listeners = []
        animation.state.addListener({
          event: onEvent
        })
        talking = false
        showDialogue.value = false
        console.log('end!')
      }
    }
  }
  animation.state.addListener(listener)
  talkIndex++
  if (!animation.state.data.skeletonData.findAnimation('Talk_0' + talkIndex + '_A')) talkIndex = 1
  talking = true
}

const onPetStudent = () => {
  if (
    talking ||
    animation.state.getCurrent(0).animation.name.toLowerCase().startsWith('start_idle')
  )
    return
  animation.state.addAnimation(1, 'Pat_01_A', true)._mixDuration = 0.3
  animation.state.addAnimation(2, 'Pat_01_M', true)._mixDuration = 0.3
  ifPetting.value = true
}

let pressTimer = null

const handleLongPress = () => {
  if (talking) return
  console.log('长按事件触发')
  onPetStudent()

  let a = setInterval(() => {
    if (pressTimer === null) {
      ifPetting.value = false
      animation.state.addAnimation(1, 'PatEnd_01_A')._mixDuration = 0.3
      animation.state.addAnimation(2, 'PatEnd_01_M')._mixDuration = 0.3
      animation.state.addAnimation(1, 'Dummy', true)._mixDuration = 0.3
      animation.state.addAnimation(2, 'Dummy', true)._mixDuration = 0.3
      console.log('end!')
      clearInterval(a)
    }
  }, 10)
}

const vLongPress = {
  mounted(el, binding) {
    const start = (e) => {
      if (pressTimer === null) {
        pressTimer = setTimeout(() => {
          binding.value(e)
        }, 500)
      }
    }
    const cancel = () => {
      if (pressTimer !== null) {
        clearTimeout(pressTimer)
        if (!ifPetting.value) {
          onInteractionWithStudent()
        }
        pressTimer = null
      }
    }
    el.addEventListener('mousedown', start)
    el.addEventListener('touchstart', start)
    el.addEventListener('click', cancel)
    el.addEventListener('mouseout', cancel)
    el.addEventListener('touchend', cancel)
    el.addEventListener('touchcancel', cancel)
  }
}

setL2D(id)

/* ===== 组件卸载时把最后一个 BGM 带走 ===== */
onUnmounted(() => {
  if (curBgm) {
    curBgm.stop()
    curBgm.unload()
  }
})
</script>

<template>
  <div id="change" v-if="!props.l2dOnly">
    <img class="css-cursor-hover-enabled" @click="setL2D('-')" src="/img/arrow.png" alt="" />
    <img class="css-cursor-hover-enabled" @click="setL2D('+')" src="/img/arrow.png" alt="" />
  </div>
  <div
    v-if="props.l2dOnly && canSkip"
    style="position: fixed; width: 100%; height: 100%"
    @click="skipStartIdle()"
  ></div>
  <a-trigger
    v-else
    :popup-visible="showDialogue"
    :popup-translate="[dialogueDisplay.x, dialogueDisplay.y]"
    :position="dialogueDisplay.position"
    :show-arrow="true"
  >
    <div class="interaction css-cursor-hover-enabled" v-long-press="handleLongPress"></div>
    <template #content>
      <div class="dialogue">
        {{ dialogue }}
      </div>
    </template>
  </a-trigger>
</template>

<style scoped>
.dialogue {
  padding: 30px 20px;
  max-width: 280px;
  width: calc(40vw - 20px);
  font-size: 24px;
  background-color: #f0f0f0dd;
  border-radius: 10px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.15);
}

#change {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.interaction {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: auto;
  width: 66%;
  height: 100%;
  cursor: pointer;
  user-select: none;
  -webkit-user-drag: none;
}

img {
  width: 32px;
  height: auto;
  animation: move 2s ease-in-out infinite;
  z-index: 9;
}

img:last-child {
  transform: rotate(180deg);
  animation: moveReverse 2s ease-in-out infinite;
}

@keyframes move {
  0% {
    transform: translateX(10px);
  }
  50% {
    transform: translateX(30px);
  }
  100% {
    transform: translateX(10px);
  }
}

@keyframes moveReverse {
  0% {
    transform: rotate(180deg) translateX(10px);
  }
  50% {
    transform: rotate(180deg) translateX(30px);
  }
  100% {
    transform: rotate(180deg) translateX(10px);
  }
}
</style>