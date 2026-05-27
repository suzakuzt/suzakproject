export const MINI_PROGRAM_COUPON_PAGE = '/pages/my-coupon/index'
export const MINI_PROGRAM_POSTER_SAVE_PAGE = '/pages/h5-activity/poster-save'

const getMiniProgramBridge = () => (typeof window === 'undefined' ? undefined : window.wx?.miniProgram)

const isMiniProgramWebView = () =>
  new Promise((resolve) => {
    const miniProgramBridge = getMiniProgramBridge()

    if (!miniProgramBridge) {
      resolve(false)
      return
    }

    if (typeof miniProgramBridge.getEnv === 'function') {
      try {
        miniProgramBridge.getEnv((res) => {
          resolve(Boolean(res?.miniprogram))
        })
      } catch {
        resolve(false)
      }
      return
    }

    resolve(typeof window !== 'undefined' && window.__wxjs_environment === 'miniprogram')
  })

export function goMiniProgramCouponPage(targetUrl = MINI_PROGRAM_COUPON_PAGE) {
  const miniProgramBridge = getMiniProgramBridge()

  if (typeof miniProgramBridge?.navigateTo === 'function') {
    miniProgramBridge.navigateTo({
      url: targetUrl,
    })
    return true
  }

  return false
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
