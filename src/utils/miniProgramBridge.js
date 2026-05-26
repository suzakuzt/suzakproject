export const MINI_PROGRAM_COUPON_PAGE = '/pages/my-coupon/index'
export const MINI_PROGRAM_POSTER_SAVE_PAGE = '/pages/h5-activity/poster-save'

const getMiniProgramBridge = () => (typeof window === 'undefined' ? undefined : window.wx?.miniProgram)

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

export function goMiniProgramPosterSavePage(posterUrl) {
  const targetUrl = buildMiniProgramPosterSaveUrl(posterUrl)
  const miniProgramBridge = getMiniProgramBridge()

  if (!targetUrl || typeof miniProgramBridge?.navigateTo !== 'function') {
    return false
  }

  miniProgramBridge.navigateTo({
    url: targetUrl,
  })
  return true
}
