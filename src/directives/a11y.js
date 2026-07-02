/**
 * a11y 辅助指令集合
 */
export const vFocusTrap = {
  mounted(el) {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        el.dispatchEvent(new CustomEvent('close'))
      }
    })
  },
}

export const vFocusFirst = {
  mounted(el) {
    const focusable = el.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    if (focusable) {
      setTimeout(() => focusable.focus(), 50)
    }
  },
}
