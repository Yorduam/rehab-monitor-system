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

export const useUiStore = defineStore('ui', {
  state: () => ({
    drawerOpen: false,
    isMobile: typeof window !== 'undefined'
      ? window.matchMedia(MOBILE_QUERY).matches
      : false,
    isIOS: detectIOS(),
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
        const raw = Math.round(window.innerHeight - vv.height - vv.offsetTop)
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

      onViewport()
      window.addEventListener('resize', onViewport)
      window.addEventListener('orientationchange', onViewport)
      const vv = window.visualViewport
      if (vv) {
        vv.addEventListener('resize', onViewport)
        vv.addEventListener('scroll', applyKeyboard)
      }

      return () => {
        mq.removeEventListener('change', apply)
        window.removeEventListener('resize', onViewport)
        window.removeEventListener('orientationchange', onViewport)
        if (vv) {
          vv.removeEventListener('resize', onViewport)
          vv.removeEventListener('scroll', applyKeyboard)
        }
      }
    }
  }
})
