export const MINI_PROGRAM_COUPON_PAGE = '/pages/my-coupon/index'

export function goMiniProgramCouponPage() {
  const targetUrl = MINI_PROGRAM_COUPON_PAGE
  const miniProgramBridge = typeof window === 'undefined' ? undefined : window.wx?.miniProgram

  if (typeof miniProgramBridge?.navigateTo === 'function') {
    miniProgramBridge.navigateTo({
      url: targetUrl,
    })
    return true
  }

  return false
}
