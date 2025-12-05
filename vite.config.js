import { fileURLToPath, URL } from 'node:url'

import { load } from 'js-yaml'
import fs from 'fs'
const config = load(fs.readFileSync('_config.yaml', 'utf8'))

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
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
            // return id.toString().split('node_modules/')[1].split('/')[0].toString()
            if (id.includes('@vue')) return 'vue'
            if (id.includes('axios')) return 'axios'
            return 'vendor'
          }
        }
      }
    }
  },
  plugins: [
    vue(),
    vueJsx(),
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
      optipng: {
        optimizationLevel: 3
      },
      mozjpeg: {
        quality: 50
      },
      pngquant: {
        quality: [0.9, 1],
        speed: 4
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox'
          },
          {
            name: 'removeEmptyAttrs',
            active: false
          }
        ]
      }
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
