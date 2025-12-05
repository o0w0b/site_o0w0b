<script setup>
import Cursor from '@/components/Cursor.vue'
import Footer from '@/components/Footer.vue'
import Level from '@/components/Level.vue'
import Toolbox from '@/components/Toolbox.vue'
import Contact from '@/components/Contact.vue'
import Task from '@/components/Task.vue'
import Loading from '@/components/Loading.vue'
import Background from '@/components/Background.vue'
import Banner from '@/components/Banner.vue'
import WelcomeDialog from '@/components/WelcomeDialog.vue'
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/composables/userStore'

const loading = ref(true)
const percent = ref(1)
const l2dOnly = ref(true)
const canSkipit = ref(true)
const changeDirection = ref('left')
const userStore = useUserStore()

import NProgress from 'nprogress'

NProgress.start()

const load = setInterval(() => {
  percent.value = NProgress.status
  if (document.readyState === 'complete' && window.l2d_complete === true) {
    NProgress.done()
    percent.value = 1
    setTimeout(() => {
      loading.value = false
    }, 2000)
    clearInterval(load)
  }
}, 1)

const switchL2D = () => {
  l2dOnly.value = !l2dOnly.value
}

const canSkip = (value) => {
  canSkipit.value = value
}
const checkScreenSize = () => {
  changeDirection.value = window.innerWidth <= 768 ? 'right' : 'left'
}

onMounted(async () => {
  // 切换背景图
  userStore.changeBackground()
})

// 判断浏览器宽度是否适合显示
checkScreenSize()
window.addEventListener('resize', checkScreenSize)
</script>

<template>
  <transition name="loading">
    <Loading v-if="loading" :percent="percent"></Loading>
  </transition>
  <div id="background" :style="userStore.curtainStyle"></div>
  <main v-if="!loading">
    <Suspense>
      <Background
        :l2dOnly="l2dOnly"
        @update:changeL2D="l2dOnly = $event"
        @canskip="canSkip"
      ></Background>
    </Suspense>
    <transition name="up">
      <Level v-if="!l2dOnly"></Level>
    </transition>
    <Toolbox :l2dOnly="l2dOnly" :canskip="canSkipit" @switch="switchL2D"></Toolbox>
    <transition name="left">
      <Contact v-if="!l2dOnly"></Contact>
    </transition>
    <Task :l2dOnly="l2dOnly"></Task>
    <transition :name="changeDirection">
      <Banner v-show="!l2dOnly"></Banner>
    </transition>
    <transition name="down">
      <Footer v-if="!l2dOnly"></Footer>
    </transition>
    <div id="curtain"></div>
  </main>
  <WelcomeDialog></WelcomeDialog>
  <Cursor></Cursor>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
}

.loading-leave-to {
  opacity: 0;
}

.loading-leave-from {
  opacity: 1;
}

.loading-leave-active {
  transition: opacity 0.5s ease-in-out;
}

.up-leave-to,
.up-enter-from {
  transform: translateY(-300px);
}

.up-leave-from,
.up-enter-to {
  transform: translateY(0);
}

.down-leave-to,
.down-enter-from {
  transform: translateY(300px) skew(-20deg);
}

.down-leave-from,
.down-enter-to {
  transform: translateY(0) skew(-20deg);
}

@media screen and (max-width: 495px) {
  .down-leave-to,
  .down-enter-from {
    transform: translateY(300px);
  }

  .down-leave-from,
  .down-enter-to {
    transform: translateY(0);
  }

  .up-leave-to,
  .up-enter-from {
    transform: translateY(-300px) skew(-10deg);
  }

  .up-leave-from,
  .up-enter-to {
    transform: translateY(0) skew(-10deg);
  }
}

.left-leave-to,
.left-enter-from {
  transform: translateX(-400px);
}

.left-leave-from,
.left-enter-to {
  transform: translateX(0);
}

.right-leave-to,
.right-enter-from {
  transform: translateX(300px);
}

.right-leave-from,
.right-enter-to {
  transform: translateX(0);
}

.up-leave-active,
.down-leave-active,
.left-leave-active,
.right-leave-active {
  transition: transform 0.3s ease-in;
}

.up-enter-active,
.down-enter-active,
.left-enter-active,
.right-enter-active {
  transition: transform 0.3s ease-out;
}

#background {
  /* background-image: url('/img/Event_Main_Stage_Bg.png');
  background-position: center;
  background-size: cover; */
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
</style>
