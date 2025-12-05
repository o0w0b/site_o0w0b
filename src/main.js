import './index.css'
import '@arco-design/web-vue/dist/arco.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ArcoVue from '@arco-design/web-vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
import { Modal } from '@arco-design/web-vue'
import { registerSW } from 'virtual:pwa-register'

import App from './App.vue'
import { useConfig } from '@/composables/useConfig'
import * as PIXI from 'pixi.js'

// 创建应用
const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(ArcoVue)
app.use(ArcoVueIcon)
app.mount('#app')

// 配置相关
const { configs } = useConfig()
const config = configs.value
document.title = config.title

// PWA 更新提示
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      Modal.confirm({
        title: config.translate.info,
        content: config.translate.update,
        okText: config.translate.ok,
        cancelText: config.translate.cancel,
        onOk: async () => {
          try {
            await updateSW(true)
          } catch {
            Modal.error({
              title: config.translate.error || 'Update failed',
              content: config.translate.updateFailed || 'Could not apply update'
            })
          }
        }
      })
    }
  })
}

// 全局链接拦截（事件委托）
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]:not(.tag)')
  if (!link) return

  link.classList.add('tag')
  e.preventDefault()

  const url = link.getAttribute('href')
  const curtain = document.querySelector('#curtain')
  if (!curtain) return

  curtain.style.display = 'block'
  setTimeout(() => {
    window.open(url, '_blank')
  }, 900)
  setTimeout(() => {
    curtain.style.display = ''
  }, 3000)
});

// 异步加载 L2D
(async () => {
  window.l2d_complete = false
  try {
    // 加载 L2D
    const loadList = config.memorialLobbies.flatMap((item, idx) => {
      const base = item.path
      const aliasSk = `skeleton${idx}`
      const aliasAtl = `atlas${idx}`
      PIXI.Assets.add({ alias: aliasSk, src: `${base}${item.skel}` })
      PIXI.Assets.add({ alias: aliasAtl, src: `${base}${item.atlas}` })
      return [aliasSk, aliasAtl]
    })
    await PIXI.Assets.load(loadList)
  } catch (err) {
    console.error('资源加载失败', err)
  } finally {
    window.l2d_complete = true
  }
})()