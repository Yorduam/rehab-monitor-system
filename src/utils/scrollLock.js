import { onMounted, onBeforeUnmount } from 'vue'
import { useUiStore } from '../stores/ui'

export function useScrollLock() {
  const ui = useUiStore()
  let locked = false
  onMounted(() => {
    ui.lockScroll()
    locked = true
  })
  onBeforeUnmount(() => {
    if (!locked) return
    locked = false
    ui.unlockScroll()
  })
}
