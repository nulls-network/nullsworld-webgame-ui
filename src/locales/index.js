import { createI18n } from 'vue-i18n/index'
import { GetLang, setStore, parseUrlQuery } from '@/utils/common'

var paramLang = parseUrlQuery().lang

// 语言列表
export let DEFAULT_LANG = paramLang || GetLang().toLowerCase()
setStore('lang', DEFAULT_LANG)

const locales = {}

const i18n = createI18n({
  locale: DEFAULT_LANG,
  messages: locales,
  globalInjection: true,
  // 隐藏警告
  silentTranslationWarn: true
})

export const setup = (lang) => {
  Object.keys(locales).forEach((lang) => {
    document.body.classList.remove(`lang-${lang}`)
  })
  document.body.classList.add(`lang-${lang}`)
  document.body.setAttribute('lang', lang)

  i18n.locale = lang
}

// 语言包按需加载
function setI18nLanguage(lang) {
  i18n.locale = lang
  document.querySelector('html').setAttribute('lang', lang)
  return lang
}

export function loadLanguageAsync(lang) {
  return import(`@/locales/${lang}`).then((msgs) => {
    i18n.global.setLocaleMessage(lang, msgs.default)
    console.log('懒加载语言', lang)
    return setI18nLanguage(lang)
  })
}

setup(DEFAULT_LANG)

// 全局使用
window.i18n = i18n

export default i18n
