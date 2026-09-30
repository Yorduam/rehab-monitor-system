import { defineStore } from 'pinia'

const MOBILE_QUERY = '(max-width: 768px)'
const KEYBOARD_THRESHOLD = 90

const detectIOS = () => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPad|iPhone|iPod/.test(ua)) return true
  return /Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document
}

const setVar = (name, value) => {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty(name, value)
}

const NAV_COLLAPSED_KEY = 'navCollapsed'

const readNavCollapsed = () => {
  try {
    return localStorage.getItem(NAV_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

const NON_TEXT_INPUTS = /^(button|checkbox|radio|range|color|file|submit|reset|image|hidden)$/i

const isTyping = () => {
  if (typeof document === 'undefined') return false
  const el = document.activeElement
  if (!el) return false
  if (el.isContentEditable) return true
  if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true
  return el.tagName === 'INPUT' && !NON_TEXT_INPUTS.test(el.type || '')
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    drawerOpen: false,
    isMobile: typeof window !== 'undefined'
      ? window.matchMedia(MOBILE_QUERY).matches
      : false,
    isIOS: detectIOS(),
    navCollapsed: readNavCollapsed(),
    keyboard: 0,
    scrollLocks: 0,
    savedScroll: 0
  }),
  actions: {
    openDrawer() {
      if (this.drawerOpen) return
      this.drawerOpen = true
      this.lockScroll()
    },
    closeDrawer() {
      if (!this.drawerOpen) return
      this.drawerOpen = false
      this.unlockScroll()
    },
    toggleDrawer() {
      if (this.drawerOpen) this.closeDrawer()
      else this.openDrawer()
    },
    setMobile(value) {
      this.isMobile = !!value
      if (!this.isMobile) this.closeDrawer()
    },
    toggleNavCollapsed() {
      this.navCollapsed = !this.navCollapsed
      try {
        localStorage.setItem(NAV_COLLAPSED_KEY, this.navCollapsed ? '1' : '0')
      } catch {}
    },

    lockScroll() {
      if (typeof document === 'undefined') return
      this.scrollLocks += 1
      if (this.scrollLocks > 1) return
      const body = document.body
      this.savedScroll = window.scrollY || document.documentElement.scrollTop || 0
      const gutter = window.innerWidth - document.documentElement.clientWidth
      body.style.position = 'fixed'
      body.style.top = `-${this.savedScroll}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
      if (gutter > 0) body.style.paddingRight = `${gutter}px`
      body.classList.add('is-scroll-locked')
    },
    unlockScroll(force = false) {
      if (typeof document === 'undefined' || this.scrollLocks === 0) return
      this.scrollLocks = force ? 0 : this.scrollLocks - 1
      if (this.scrollLocks > 0) return
      const body = document.body
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.paddingRight = ''
      body.classList.remove('is-scroll-locked')
      window.scrollTo(0, this.savedScroll)
    },

    watchViewport() {
      if (typeof window === 'undefined') return () => {}
      const mq = window.matchMedia(MOBILE_QUERY)
      const apply = (e) => this.setMobile(e.matches)
      apply(mq)
      mq.addEventListener('change', apply)

      if (this.isIOS) document.documentElement.classList.add('is-ios')

      const applyHeight = () => {
        const vv = window.visualViewport
        setVar('--app-h', `${Math.round((vv && vv.height) || window.innerHeight)}px`)
      }

      const applyKeyboard = () => {
        const vv = window.visualViewport
        if (!vv) return
        const raw = isTyping()
          ? Math.round(window.innerHeight - vv.height - Math.max(0, vv.offsetTop))
          : 0
        const kb = raw > KEYBOARD_THRESHOLD ? raw : 0
        if (kb !== this.keyboard) {
          this.keyboard = kb
          setVar('--kb', `${kb}px`)
          document.documentElement.classList.toggle('has-keyboard', kb > 0)
        }
      }

      const onViewport = () => {
        applyHeight()
        applyKeyboard()
      }

      const onFocusChange = () => setTimeout(applyKeyboard, 0)

      onViewport()
      window.addEventListener('resize', onViewport)
      window.addEventListener('orientationchange', onViewport)
      document.addEventListener('focusin', onFocusChange)
      document.addEventListener('focusout', onFocusChange)
      const vv = window.visualViewport
      if (vv) {
        vv.addEventListener('resize', onViewport)
        vv.addEventListener('scroll', applyKeyboard)
      }

      return () => {
        mq.removeEventListener('change', apply)
        window.removeEventListener('resize', onViewport)
        window.removeEventListener('orientationchange', onViewport)
        document.removeEventListener('focusin', onFocusChange)
        document.removeEventListener('focusout', onFocusChange)
        if (vv) {
          vv.removeEventListener('resize', onViewport)
          vv.removeEventListener('scroll', applyKeyboard)
        }
      }
    }
  }
})
