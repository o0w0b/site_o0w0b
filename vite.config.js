import { fileURLToPath, URL } from 'node:url'
import { load } from 'js-yaml'

import fs from 'fs'
const config = load(fs.readFileSync('_config.yaml', 'utf8'))

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import Components from 'unplugin-vue-components/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import viteCompression from 'vite-plugin-compression'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { VitePWA } from 'vite-plugin-pwa'
import { createHtmlPlugin } from 'vite-plugin-html'
import yaml from '@rollup/plugin-yaml'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    assetsInlineLimit: 0,
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@vue')) return 'vue'
            if (id.includes('axios')) return 'axios'
            if (id.includes('howler')) return 'howler'
            if (id.includes('@arco')) return 'arco'
            if (id.includes('pixi.js') || id.includes('@pixi')) return 'pixi'
            if (id.includes('@esotericsoftware')) return 'spine-pixi'
            return 'vendor'
          }
        }
      }
    }
  },
  plugins: [
    vue(),
    vueJsx(),
    Components({
      dirs: ['src/components'],   // 去这里扫 .vue
      extensions: ['vue'],
      deep: false,                 // true 扫描子目录
      resolvers: [
        ArcoResolver({              // Arco 解析器
          resolveIcons: true,        // 按需导入图标组件
          sideEffect: true           // 自动引样式
        })
      ]
    }),
    AutoImport({
      // 强制导入函数式 API，避免未识别报错
      imports: [
        'vue',
        {
          '@arco-design/web-vue': ['Modal']
        }
      ],
      resolvers: [ArcoResolver()],
    }),
    createHtmlPlugin({
      inject: {
        data: {
          title: config.title,
          favicon: config.favicon,
          themeColor: config.manifest.theme_color,
          description: config.description,
          keywords: config.keywords
        }
      }
    }),
    ViteImageOptimizer({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false
      },
      // 先进行无损压缩，再进行有损压缩
      optipng: {
        optimizationLevel: 3
      },
      pngquant: {
        quality: [0.9, 1],
        speed: 4
      },
      // 
      mozjpeg: {
        quality: 50
      },
      svgo: {
        plugins: [
          { name: 'removeViewBox', active: false }, // 保留 viewBox
          { name: 'removeEmptyAttrs', active: false }, // 保留空属性
          { name: 'removeComments', active: true }, // 删除注释
        ]
      },
      // 跳过 public/l2d/Yuuka 整个目录
      exclude: /\/public\/l2d\/Yuuka\/.*/,
    }),
    VitePWA({
      mode: 'production',
      base: '/',
      registerType: 'prompt',
      injectRegister: 'auto',
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'ba-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: config.manifest
    }),
    viteCompression({
      threshold: 10240 // the unit is Bytes
    }),
    yaml()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
