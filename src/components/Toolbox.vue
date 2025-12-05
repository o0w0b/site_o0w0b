<script setup>
import { Modal } from '@arco-design/web-vue'
import { h, ref } from 'vue'

import { useConfig } from '@/composables/useConfig'
import { useUserStore } from '@/composables/userStore'

const { configs } = useConfig()
const config = configs.value

const userStore = useUserStore()

const emit = defineEmits(['switch'])
const props = defineProps(['l2dOnly', 'canskip'])

const max_ap = userStore.maxAp
const ap = ref(
  max_ap -
    Math.trunc(
      max_ap *
        ((new Date().getTime() -
          new Date(
            `${new Date().getFullYear()}-${
              new Date().getMonth() + 1
            }-${new Date().getDate()} 00:00:00`
          )) /
          86400000)
    )
)
const gold = ref(
    Math.trunc(
      config.level * (config.nextExp + 1) / (config.exp + 1) *
      new Date().getSeconds() * 2233 * 9 + 2112
    )
)
const pyroxene = ref(
    Math.trunc(
      config.level * (config.nextExp + 1) / (config.exp + 1) *
      new Date().getSeconds() * 37 * 9 + 2112
    )
)
const img = ref('/img/max.png')
const showMin = ref(false)
const hover = ref(window.matchMedia('(hover: none)').matches)

const about = () => {
  Modal.open({
    title: config.translate.about,
    content: () => [
      h('p', {}, 'o0w0b の homepage'),
      config.ICP
        ? [
            h('br', {}, ''),
            h('a', { href: 'https://beian.miit.gov.cn/', target: '_blank' }, config.ICP)
          ]
        : null
    ],
    footer: false
  })
}

const change = () => {
  if (!props.canskip) {
    img.value = img.value === '/img/min.png' ? '/img/max.png' : '/img/min.png'
    emit('switch')
  }
}

document.body.addEventListener('click', () => {
  if (props.l2dOnly && hover.value) {
    showMin.value = !showMin.value
  } else {
    showMin.value = true
  }
})

window.matchMedia('(hover: none)').addListener((e) => {
  hover.value = e.matches
})

setInterval(() => {
  ap.value++
}, 60000)
</script>

<template>
  <div class="toolbox-box">
    <div
      class="toolbox"
      :style="{
        transform: (!props.l2dOnly ? 'translateY(0)' : 'translateY(-300px)') + ' skew(-10deg)',
        transition: 'transform 0.3s ' + (!props.l2dOnly ? 'ease-out' : 'ease-in')
      }"
    >
      <img src="/img/ap.png" alt="" />
      <span>{{ ap + '/' + max_ap }}</span>
    </div>
    <div
      class="toolbox"
      :style="{
        transform: (!props.l2dOnly ? 'translateY(0)' : 'translateY(-300px)') + ' skew(-10deg)',
        transition: 'transform 0.3s ' + (!props.l2dOnly ? 'ease-out' : 'ease-in')
      }"
    >
      <img src="/img/gold.png" alt="" />
      <span>{{ gold }}</span>
    </div>
    <div
      class="toolbox"
      :style="{
        transform: (!props.l2dOnly ? 'translateY(0)' : 'translateY(-300px)') + ' skew(-10deg)',
        transition: 'transform 0.3s ' + (!props.l2dOnly ? 'ease-out' : 'ease-in')
      }"
    >
      <img src="/img/pyroxene.png" alt="" />
      <span>{{ pyroxene }}</span>
    </div>
    <a
      class="about toolbox"
      @click="about"
      :style="{
        transform: (!props.l2dOnly ? 'translateY(0)' : 'translateY(-300px)') + ' skew(-10deg)',
        transition: 'transform 0.3s ' + (!props.l2dOnly ? 'ease-out' : 'ease-in')
      }"
    >
      <icon-info-circle class="css-cursor-hover-enabled" />
    </a>
    <a
      id="change"
      class="l2d toolbox"
      :class="{ canHover: !hover && !props.canskip }"
      @click="change"
      :style="{
        transform: (!props.l2dOnly ? 'translateY(0)' : 'translateY(-76px)') + ' skew(-10deg)',
        transition: 'transform 0.3s ' + (!props.l2dOnly ? 'ease-out' : 'ease-in') + ',opacity 0.6s',
        opacity: (!props.l2dOnly || (showMin && hover)) && !props.canskip ? 1 : 0
      }"
    >
      <img alt="" :src="img" />
    </a>
  </div>
</template>

<style scoped>
.toolbox-box {
  position: absolute;
  right: 20px;
  top: 40px;
  display: inline-flex;
}

.toolbox-box .toolbox {
  width: 220px;
  height: 56px;
  background: #fffd;
  color: #003153;
  margin: 0 10px;
  transform: skew(-10deg);
  border-radius: 6px;
  filter: drop-shadow(0px 0px 3px #0003);
  transition:
    background-color 0.3s,
    transform 0.1s;
  display: flex;
  align-items: center;
}

.toolbox img {
  height: 70%;
  transform: skew(10deg);
  margin: 0 8px 0 10px;
}
.toolbox span {
  font-size: 26px;
  transform: skew(10deg);
}

.toolbox-box .toolbox.about,
.toolbox-box .toolbox.l2d {
  width: 80px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.toolbox-box .toolbox.l2d {
  position: absolute;
  right: 0;
  top: 76px;
  overflow: hidden;
}

.toolbox.l2d img {
  filter: drop-shadow(-100vw 0px 0px #003153);
  transform: translateX(100vw);
  height: 32px;
}

.toolbox-box .toolbox:hover {
  background: #fffe;
}

.toolbox-box .toolbox.about:active,
.toolbox-box .toolbox.l2d:active {
  transform: skew(-10deg) scale(0.9);
}

.arco-icon {
  font-size: 32px;
  transform: skew(10deg);
}

@media screen and (max-width: 1199px) {
  .toolbox:not(.about) {
    display: none;
  }
}

.toolbox-box .toolbox.l2d.canHover:hover {
  opacity: 1 !important;
}
</style>
