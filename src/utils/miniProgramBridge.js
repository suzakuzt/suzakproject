export const MINI_PROGRAM_COUPON_PAGE = '/pages/my-coupon/index'
export const MINI_PROGRAM_POSTER_SAVE_PAGE = '/pages/h5-activity/poster-save'

const MINI_PROGRAM_ENV_TIMEOUT_MS = 250
const getMiniProgramBridge = () => (typeof window === 'undefined' ? undefined : window.wx?.miniProgram)

const isMiniProgramWebView = () =>
  new Promise((resolve) => {
    const miniProgramBridge = getMiniProgramBridge()
    let settled = false
    let envTimer

    if (!miniProgramBridge) {
      resolve(false)
      return
    }

    const finish = (value) => {
      if (settled) {
        return
      }

      settled = true
      if (envTimer) {
        window.clearTimeout(envTimer)
      }
      resolve(value)
    }

    if (typeof miniProgramBridge.getEnv === 'function') {
      envTimer = window.setTimeout(() => finish(false), MINI_PROGRAM_ENV_TIMEOUT_MS)
      try {
        miniProgramBridge.getEnv((res) => {
          finish(Boolean(res?.miniprogram))
        })
      } catch {
        finish(false)
      }
      return
    }

    finish(typeof window !== 'undefined' && window.__wxjs_environment === 'miniprogram')
  })

export async function goMiniProgramCouponPage(targetUrl = MINI_PROGRAM_COUPON_PAGE, options = {}) {
  const miniProgramBridge = getMiniProgramBridge()

  if (!targetUrl || typeof miniProgramBridge?.navigateTo !== 'function') {
    return false
  }

  if (!(await isMiniProgramWebView())) {
    return false
  }

  const navigateOptions = {
    url: targetUrl,
  }

  if (typeof options.fail === 'function') {
    navigateOptions.fail = options.fail
  }

  miniProgramBridge.navigateTo(navigateOptions)
  return true
}

export function buildMiniProgramPosterSaveUrl(posterUrl) {
  if (!posterUrl) {
    return ''
  }

  return `${MINI_PROGRAM_POSTER_SAVE_PAGE}?posterUrl=${encodeURIComponent(posterUrl)}`
}

export async function goMiniProgramPosterSavePage(posterUrl) {
  const targetUrl = buildMiniProgramPosterSaveUrl(posterUrl)
  const miniProgramBridge = getMiniProgramBridge()

  if (!targetUrl || typeof miniProgramBridge?.navigateTo !== 'function') {
    return false
  }

  if (!(await isMiniProgramWebView())) {
    return false
  }

  miniProgramBridge.navigateTo({
    url: targetUrl,
  })
  return true
}
