import { ref, computed } from 'vue'
import originalConfig from '/_config.yaml'
import enUS from '../locales/en-US.yaml'
import jaJP from '../locales/ja-JP.yaml'

// 支持的语言配置
const localeConfigs = {
  'zh-CN': originalConfig,
  'en-US': enUS,
  'ja-JP': jaJP
}

export function useConfig() {
  const currentLocale = ref('zh-CN')

  // 自动检测浏览器语言
  const autoDetectLanguage = () => {
    const browserLang = navigator.language || navigator.userLanguage

    // console.log('检测浏览器语言:', browserLang)

    const supportedLanguages = Object.keys(localeConfigs)
    const languageMap = {
      zh: 'zh-CN',
      'zh-CN': 'zh-CN',
      'zh-TW': 'zh-CN',
      'zh-HK': 'zh-CN',
      en: 'en-US',
      'en-US': 'en-US',
      'en-GB': 'en-US',
      ja: 'ja-JP',
      'ja-JP': 'ja-JP'
    }

    // 精确匹配
    if (languageMap[browserLang] && supportedLanguages.includes(languageMap[browserLang])) {
      return languageMap[browserLang]
    }

    // 前缀匹配
    const prefix = browserLang.split('-')[0]
    if (languageMap[prefix] && supportedLanguages.includes(languageMap[prefix])) {
      return languageMap[prefix]
    }

    // 默认中文
    return 'zh-CN'
  }

  // 确保数字字段安全的配置获取器
  const getSafeConfig = (locale) => {
    const config = localeConfigs[locale] || originalConfig

    // 确保数字字段有安全的默认值
    return {
      ...config,
      // 个人信息数字字段
      level: Number(config.level) || 1,
      exp: Number(config.exp) || 0,
      nextExp: Number(config.nextExp) || 0,

      // 确保数组存在且安全
      dock: config.dock || [],
      contact: config.contact || [],
      memorialLobbies: config.memorialLobbies || [],

      // 确保 banner.musicID 数组存在且安全
      banner: {
        musicID: (config.banner?.musicID || []).map((id) => Number(id) || 0),
        ...config.banner
      }
    }
  }

  // 初始化 - 自动检测语言（立即执行）
  const init = () => {
    const detectedLang = autoDetectLanguage()
    currentLocale.value = detectedLang

    // console.log('语言自动检测完成:', {
    //   最终语言: detectedLang,
    //   浏览器语言: navigator.language,
    //   支持的语言: Object.keys(localeConfigs)
    // })
  }

  // 立即执行初始化
  init()

  // 获取当前配置（安全的版本）- 使用 computed 确保响应式
  const configs = computed(() => {
    return getSafeConfig(currentLocale.value)
  })

  return {
    // 在模板中使用的响应式配置
    configs,
    // 当前语言
    locale: currentLocale,
    // 支持的语言列表
    availableLocales: Object.keys(localeConfigs)
  }
}
