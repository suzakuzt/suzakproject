import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from './App.vue'
import { installRuntimeMonitor } from './utils/runtimeMonitor'

vi.mock('./components/HelloWorld.vue', () => ({
  default: {
    template: '<div data-testid="vite-starter" />',
  },
}))

const mountHome = (props = {}) => {
  window.history.replaceState({}, '', '/activity/home')

  return mount(App, { props })
}
const mountRules = (props = {}) => {
  window.history.replaceState({}, '', '/activity/rules')

  return mount(App, { props: { initialPage: 'rules', ...props } })
}
const mountResult = (props = {}) => {
  window.history.replaceState({}, '', '/activity/result')

  return mount(App, { props: { initialPage: 'p2', ...props } })
}
const readSource = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8')

const readPngSize = (relativePath) => {
  const buffer = readFileSync(resolve(process.cwd(), relativePath))

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

describe('P1 activity home', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('renders the confirmed P1 home copy with one default draw chance', () => {
    const wrapper = mountHome()

    expect(wrapper.text()).toContain('立即摇签')
    expect(wrapper.text()).toContain('我的摇签机会 1次')
    expect(wrapper.text()).toContain('活动规则')
    expect(wrapper.text()).toContain('我的奖励')
    expect(wrapper.text()).toContain('分享获取次数')
    expect(wrapper.text()).not.toContain('今日已摇签')
  })

  it('uses rebuilt P1 design assets instead of legacy sliced filenames', () => {
    const wrapper = mountHome()
    const html = wrapper.html()

    expect(html).toContain('bg_rank_success.jpg')
    expect(html).toContain('element_lottery_box.png')
    expect(html).toContain('btn_draw_now.png')
    expect(html).toContain('btn_activity_rules.png')
    expect(html).toContain('lottery-shadow')
    expect(html).not.toContain('element_lottery_shadow.png')
    expect(html).not.toContain('home-bg-p1.png')
    expect(html).not.toContain('home-tube-p1.png')
    expect(html).not.toContain('home-button-p1.png')
    expect(html).not.toContain('home-rule-p1.png')
    expect(html).not.toContain('home-title-p1.png')
    expect(html).not.toContain('text_title_prize.png')
    expect(html).not.toContain('button.png')
    expect(html).not.toContain('title.png')
  })

  it('uses the latest button and lottery-box image assets', () => {
    expect(readPngSize('public/assets/home/btn_draw_now.png')).toEqual({
      width: 1450,
      height: 386,
    })
    expect(readPngSize('public/assets/home/element_lottery_box.png')).toEqual({
      width: 1254,
      height: 1254,
    })
  })

  it('shows the Prime Cuts brand logo on home, result, and rewards pages', () => {
    expect(readPngSize('public/assets/common/element_prime_cuts_logo.png')).toEqual({
      width: 960,
      height: 958,
    })

    const home = mountHome()
    const result = mountResult()
    const rewards = mount(App, { props: { initialPage: 'p6' } })

    expect(home.get('[data-testid="brand-logo-home"]').attributes('src')).toContain(
      'assets/common/element_prime_cuts_logo.png',
    )
    expect(result.get('[data-testid="brand-logo-result"]').attributes('src')).toContain(
      'assets/common/element_prime_cuts_logo.png',
    )
    expect(rewards.get('[data-testid="brand-logo-rewards"]').attributes('src')).toContain(
      'assets/common/element_prime_cuts_logo.png',
    )
  })

  it('imports the P4-1 unified result design assets', () => {
    expect(readPngSize('public/assets/p4/bg_ai_result_page.png')).toEqual({
      width: 941,
      height: 1672,
    })
    expect(readPngSize('public/assets/p4/text_beef_super_luck_sign.png')).toEqual({
      width: 1881,
      height: 461,
    })
    expect(readPngSize('public/assets/p4/element_luck_tag_vertical_full.png')).toEqual({
      width: 319,
      height: 2106,
    })
    expect(readPngSize('public/assets/p4/product_flat_iron_steak.png')).toEqual({
      width: 1105,
      height: 657,
    })
    expect(readPngSize('public/assets/p4/product_ribeye_steak.png')).toEqual({
      width: 1236,
      height: 1204,
    })
    expect(readPngSize('public/assets/p4/product_sirloin_steak.png')).toEqual({
      width: 1206,
      height: 699,
    })
    expect(readPngSize('public/assets/p4/product_tenderloin_steak.png')).toEqual({
      width: 1226,
      height: 739,
    })
    expect(readPngSize('public/assets/p4/text_ai_result_scroll_header_double_tassel.png')).toEqual({
      width: 2236,
      height: 590,
    })
    expect(readPngSize('public/assets/p4/element_ai_result_blank_scroll_panel.png')).toEqual({
      width: 1121,
      height: 845,
    })
    expect(readPngSize('public/assets/p4/text_claim_exclusive_reward_sign.png')).toEqual({
      width: 1854,
      height: 487,
    })
  })

  it('keeps the P1 home layout relaxed around the lottery area', () => {
    const css = readSource('src/style.css')

    expect(css).toMatch(/\.rule-entry\s*{[^}]*top:\s*1\.9%;/s)
    expect(css).toMatch(/\.lottery-shadow\s*{[^}]*top:\s*66\.6%;[^}]*left:\s*53%;[^}]*width:\s*50%;[^}]*radial-gradient\(ellipse at 70% 58%/s)
    expect(css).toMatch(/\.lottery-tube\s*{[^}]*top:\s*39\.5%;[^}]*width:\s*68%;/s)
    expect(css).toMatch(/\.lottery-tube img\s*{[^}]*filter:\s*none;/s)
    expect(css).toMatch(/\.draw-button\s*{[^}]*top:\s*81\.4%;[^}]*width:\s*70%;/s)
    expect(css).toMatch(/\.bottom-nav\s*{[^}]*bottom:\s*2\.4%;/s)
    expect(css).toMatch(/\.brand-logo\s*{[^}]*position:\s*absolute;[^}]*object-fit:\s*contain;/s)
    expect(css).toMatch(/\.home-brand-logo\s*{[^}]*top:\s*3\.8%;[^}]*left:\s*4\.8%;[^}]*width:\s*14\.6%;/s)
    expect(css).toMatch(/\.p2-brand-logo\s*{[^}]*top:\s*8\.8%;[^}]*left:\s*6\.2%;[^}]*width:\s*10\.2%;/s)
    expect(css).toMatch(/\.p6-brand-logo\s*{[^}]*top:\s*12%;[^}]*left:\s*4\.8%;[^}]*width:\s*10\.8%;/s)
  })

  it('keeps the current home palette and avoids decorative stage overlays', () => {
    const css = readSource('src/style.css')

    expect(css).toContain('--theme-primary: #b80606;')
    expect(css).toContain('--gold-deep: #c99b4d;')
    expect(css).not.toContain('.home-stage::before')
    expect(css).toMatch(/\.home-stage\s*{[^}]*background-size:\s*100% 100%;/s)
    expect(css).toMatch(/\.lottery-shadow\s*{[^}]*mix-blend-mode:\s*multiply;/s)
  })

  it('routes to the P2 placeholder when the primary draw button has chance', async () => {
    const wrapper = mountHome()

    await wrapper.get('[data-testid="draw-button"]').trigger('click')
    await wrapper.get('[data-testid="draw-animation-fallback"]').trigger('animationend')

    expect(wrapper.text()).toContain('六月考运签')
    expect(wrapper.get('[data-testid="p2-ai-scroll"]').exists()).toBe(true)
  })

  it('uses the same draw entrance when clicking the lottery tube', async () => {
    const wrapper = mountHome()

    await wrapper.get('[data-testid="lottery-tube"]').trigger('click')
    await wrapper.get('[data-testid="draw-animation-fallback"]').trigger('animationend')

    expect(wrapper.text()).toContain('六月考运签')
    expect(wrapper.get('[data-testid="p2-ai-scroll"]').exists()).toBe(true)
  })

  it('shows the no-chance tip instead of routing when draw chance is zero', async () => {
    const wrapper = mountHome({ initialChance: 0 })

    await wrapper.get('[data-testid="draw-button"]').trigger('click')

    expect(wrapper.text()).toContain('今日机会已用完，分享可再得机会')
    expect(wrapper.text()).not.toContain('六月考运签')
  })

  it('renders P2/P4 as one asset-based result page with a collapsed AI scroll', () => {
    const wrapper = mountResult({
      initialP2Result: {
        signType: 'LUCKY_SIGN',
        signLevel: 'TOP_SIGN',
        mainTextColumns: ['CENTER_COPY'],
        goodFor: 'LEFT_COPY',
        avoid: 'RIGHT_COPY',
      },
      initialP4Detail: {
        explainLines: ['INLINE_AI_COPY'],
        product: {
          productName: 'PRODUCT_NAME',
          productImage: 'product_flat_iron_steak.png',
        },
        benefit: {
          claimButtonText: 'CLAIM_NOW',
        },
      },
    })
    const html = wrapper.html()

    expect(wrapper.get('[data-testid="p2-combined-card"]').exists()).toBe(true)
    expect(html).toContain('bg_ai_result_page.png')
    expect(html).toContain('text_beef_super_luck_sign.png')
    expect(html).toContain('element_luck_tag_vertical_full.png')
    expect(html).toContain('text_ai_result_scroll_header_double_tassel.png')
    expect(html).toContain('text_claim_exclusive_reward_sign.png')
    expect(wrapper.text()).toContain('拨云见吉')
    expect(wrapper.text()).toContain('轻轻划开，解锁 AI 解签')
    expect(wrapper.get('[data-testid="p2-left-luck"]').text()).toContain('LEFT_COPY')
    expect(wrapper.get('[data-testid="p2-right-luck"]').text()).toContain('RIGHT_COPY')
    expect(wrapper.get('[data-testid="p2-product-image"]').attributes('src')).toContain('product_flat_iron_steak.png')
    expect(wrapper.get('[data-testid="p2-ai-scroll"]').classes()).not.toContain('is-open')
    expect(wrapper.get('[data-testid="p2-ai-panel"]').text()).not.toContain('INLINE_AI_COPY')
    expect(wrapper.get('[data-testid="p2-claim-benefit"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="share-poster"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="share-poster"]').text()).toBe('保存海报分享')
  })

  it('opens a simple share poster with sign copy and QR code but without the product image', async () => {
    const wrapper = mountResult({
      initialP2Result: {
        goodFor: 'LEFT_COPY',
        avoid: 'RIGHT_COPY',
      },
      initialP4Detail: {
        product: {
          productName: 'PRODUCT_NAME',
          productImage: 'product_flat_iron_steak.png',
        },
      },
    })

    await wrapper.get('[data-testid="share-poster"]').trigger('click')

    const poster = wrapper.get('[data-testid="p2-poster-dialog"]')
    expect(poster.text()).toContain('LEFT_COPY')
    expect(poster.text()).toContain('RIGHT_COPY')
    expect(poster.find('[data-testid="p2-poster-qrcode"]').attributes('src')).toContain('qrcode_wechat_group.png')
    expect(poster.find('[data-testid="p2-product-image"]').exists()).toBe(false)
    expect(poster.html()).not.toContain('product_flat_iron_steak.png')
    expect(poster.text()).not.toContain('海报')
    expect(poster.get('[data-testid="save-p2-poster"]').text()).toBe('保存')
    expect(poster.get('[data-testid="close-p2-panel"]').attributes('aria-label')).toBe('关闭')

    await poster.get('[data-testid="close-p2-panel"]').trigger('click')

    expect(wrapper.find('[data-testid="p2-poster-dialog"]').exists()).toBe(false)
  })

  it('saves the poster image through the backend poster API before sharing', async () => {
    const imageDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='
    const savePoster = vi.fn().mockResolvedValue({
      success: true,
      saved: true,
      poster_id: 'poster_test',
      poster_url: '/api/poster/image/poster_test',
    })
    const createSession = vi.fn().mockResolvedValue({ session_token: 'sess_test' })
    const trackEvent = vi.fn().mockResolvedValue({ success: true })
    const canvasContext = {
      beginPath: vi.fn(),
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      lineTo: vi.fn(),
      moveTo: vi.fn(),
      restore: vi.fn(),
      save: vi.fn(),
      scale: vi.fn(),
      stroke: vi.fn(),
      strokeRect: vi.fn(),
    }
    const originalImage = globalThis.Image
    const originalToBlob = HTMLCanvasElement.prototype.toBlob
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext)
    const toDataUrlSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(imageDataUrl)
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:poster')
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => callback(new Blob(['png'], { type: 'image/png' })))
    globalThis.Image = class {
      set src(value) {
        this._src = value
        setTimeout(() => this.onload?.(), 0)
      }
    }
    const wrapper = mountResult({
      apiClient: { createSession, savePoster, trackEvent },
    })

    await wrapper.get('[data-testid="share-poster"]').trigger('click')
    await wrapper.get('[data-testid="save-p2-poster"]').trigger('click')
    await new Promise((resolve) => setTimeout(resolve, 0))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(savePoster).toHaveBeenCalledWith(
      expect.objectContaining({
        session_token: 'sess_test',
        page_code: 'p2',
        poster_type: 'result_share',
        image_data_url: imageDataUrl,
      }),
    )
    expect(wrapper.get('[data-testid="p2-poster-save-message"]').text()).toContain('海报已保存')
    expect(wrapper.get('[data-testid="p2-poster-generated-preview"]').attributes('src')).toBe(
      '/api/poster/image/poster_test',
    )
    expect(wrapper.get('[data-testid="p2-poster-save-message"]').text()).toContain('长按上方图片')

    expect(canvasContext.moveTo).not.toHaveBeenCalledWith(80, 400)
    expect(canvasContext.moveTo).not.toHaveBeenCalledWith(80, 562)

    wrapper.unmount()
    globalThis.Image = originalImage
    HTMLCanvasElement.prototype.toBlob = originalToBlob
    getContextSpy.mockRestore()
    toDataUrlSpy.mockRestore()
    anchorClickSpy.mockRestore()
    createObjectUrlSpy.mockRestore()
    revokeObjectUrlSpy.mockRestore()
  })

  it('rotates the default P2/P4 beef product image on each result-page entry', () => {
    const renderedImages = []

    for (let index = 0; index < 5; index += 1) {
      const wrapper = mountResult()
      renderedImages.push(wrapper.get('[data-testid="p2-product-image"]').attributes('src'))
      wrapper.unmount()
    }

    expect(renderedImages.map((src) => src.split('/').pop())).toEqual([
      'product_flat_iron_steak.png',
      'product_ribeye_steak.png',
      'product_sirloin_steak.png',
      'product_tenderloin_steak.png',
      'product_flat_iron_steak.png',
    ])
  })

  it('opens the AI scroll inline on P2 without switching to the P4 page', async () => {
    const wrapper = mountResult({
      initialP4Detail: {
        explainLines: ['INLINE_AI_COPY'],
        product: {
          productName: 'PRODUCT_NAME',
          productImage: 'product_ribeye_steak.png',
        },
      },
    })

    await wrapper.get('[data-testid="ask-xiaopu"]').trigger('click')

    expect(wrapper.get('[data-testid="p2-combined-card"]').exists()).toBe(true)
    expect(wrapper.find('.p4-page').exists()).toBe(false)
    expect(wrapper.get('[data-testid="p2-ai-scroll"]').classes()).toContain('is-open')
    expect(wrapper.get('[data-testid="p2-ai-result"]').text()).toContain('INLINE_AI_COPY')
  })

  it('keeps the P2/P4 sign typography and tilted beef product aligned to the reference design', () => {
    const css = readSource('src/style.css')

    expect(css).toMatch(/\.p2-title-sign\s*{[^}]*width:\s*56%;/s)
    expect(css).toMatch(/\.p2-stage\s*{[^}]*width:\s*min\(100vw,\s*430px\);[^}]*aspect-ratio:\s*941\s*\/\s*1672;/s)
    expect(css).toMatch(/\.p2-fortune-copy\s*{[^}]*top:\s*17%;/s)
    expect(css).toMatch(/\.p2-fortune-copy h2\s*{[^}]*font-family:\s*"STXingkai",\s*"华文行楷",\s*"FZKai-Z03S",\s*"KaiTi",\s*"STKaiti",\s*serif;/s)
    expect(css).toMatch(/\.p2-side-copy,\s*\.p2-ai-panel\s*{[^}]*font-family:\s*"STKaiti",\s*"KaiTi",\s*"Kaiti SC",\s*"Songti SC",\s*serif;/s)
    expect(css).toMatch(/\.p2-result-body\s*{[^}]*height:\s*41\.6%;/s)
    expect(css).toMatch(/\.p2-fortune-copy h2\s*{[^}]*transform:\s*skewX\(-8deg\)\s*rotate\(-1\.5deg\)\s*scaleX\(0\.82\);/s)
    expect(css).toMatch(/\.p2-fortune-copy p\s*{[^}]*gap:\s*5px;[^}]*font-size:\s*clamp\(12px,\s*3\.25vw,\s*15px\);/s)
    expect(css).toMatch(/\.p2-fortune-copy p::before,\s*\.p2-fortune-copy p::after\s*{[^}]*width:\s*24px;/s)
    expect(css).toMatch(/\.p2-side-text\s*{[^}]*top:\s*0\.6%;[^}]*width:\s*11\.2%;[^}]*height:\s*100%;/s)
    expect(css).toMatch(/\.p2-good-for\s*{[^}]*left:\s*10\.4%;/s)
    expect(css).toMatch(/\.p2-avoid\s*{[^}]*right:\s*12\.2%;/s)
    expect(css).toMatch(/\.p2-side-copy\s*{[^}]*right:\s*21%;[^}]*left:\s*21%;/s)
    expect(css).toMatch(/\.p2-side-copy p\s*{[^}]*font-weight:\s*900;/s)
    expect(css).toMatch(/\.p2-side-copy p\s*{[^}]*text-shadow:\s*0\.35px 0 0 currentColor/s)
    expect(css).toMatch(/\.p2-product-hero\s*{[^}]*width:\s*48%;[^}]*height:\s*48%;/s)
    expect(css).toMatch(/\.p2-product-hero::after\s*{[^}]*radial-gradient\(ellipse/s)
    expect(css).toMatch(/\.p2-product-hero img\s*{[^}]*transform:\s*rotate\(-10deg\)\s*scale\(1\.01\);/s)
    expect(css).toMatch(/\.p2-product-hero img\s*{[^}]*drop-shadow\(0 26px 20px rgba\(82,\s*5,\s*0,\s*0\.36\)\)/s)
    expect(css).toMatch(/\.p2-ai-panel\s*{[^}]*top:\s*56\.4%;[^}]*width:\s*66%;/s)
    expect(css).toMatch(/\.p2-scroll-head\s*{[^}]*width:\s*80%;[^}]*margin:\s*0 auto;/s)
    expect(css).toMatch(/\.p2-scroll-body\s*{[^}]*url\("\/assets\/p4\/element_ai_result_blank_scroll_panel\.png"\)/s)
    expect(css).toMatch(/\.p2-scroll-body\s*{[^}]*width:\s*92%;[^}]*margin:\s*-18\.8%\s*auto\s*0;/s)
    expect(css).toMatch(/\.p2-ai-scroll\.is-open \.p2-scroll-body\s*{[^}]*min-height:\s*220px;[^}]*max-height:\s*252px;[^}]*padding:\s*34px\s*30px\s*48px;/s)
    expect(css).toMatch(/\.p2-ai-result\s*{[^}]*max-height:\s*170px;/s)
    expect(css).not.toMatch(/\.p2-scroll-foot\s*{[^}]*radial-gradient/s)
    expect(css).toMatch(/\.p2-ai-loading\s*{[^}]*gap:\s*4px;/s)
    expect(css).toMatch(/\.p2-ai-panel \.p4-thinking-line\s*{[^}]*font-size:\s*13px;/s)
    expect(css).toMatch(/\.p2-claim-button\s*{[^}]*bottom:\s*4\.2%;[^}]*width:\s*60%;/s)
    expect(css).toMatch(/\.p2-poster-button\s*{[^}]*width:\s*40%;[^}]*border-bottom:\s*2px solid #d8b25f;[^}]*background:\s*transparent;/s)
    expect(css).toMatch(/\.p2-poster-card\s*{[^}]*border:\s*2px solid #080000;/s)
    expect(css).toMatch(/\.p2-poster-qrcode\s*{[^}]*border:\s*1px solid #080000;/s)
    expect(css).toMatch(/\.p2-poster-lines\s*{[^}]*background:\s*linear-gradient\(90deg,\s*transparent,\s*rgba\(133,\s*62,\s*24,\s*0\.07\),\s*transparent\);/s)
    expect(css).not.toMatch(/\.p2-poster-lines\s*{[^}]*border-top:/s)
    expect(css).not.toMatch(/\.p2-poster-lines\s*{[^}]*border-bottom:/s)
    expect(css).toMatch(/@media \(max-height:\s*720px\)\s*{[^}]*\.p2-stage\s*{[^}]*width:\s*min\(100vw,\s*405px\);/s)
    expect(css).toMatch(/@media \(max-height:\s*680px\)\s*{[^}]*\.p2-stage\s*{[^}]*width:\s*min\(100vw,\s*382px\);/s)
    expect(css).toMatch(/@media \(max-height:\s*640px\)\s*{[^}]*\.p2-stage\s*{[^}]*width:\s*min\(100vw,\s*360px\);/s)
  })

  it('opens the benefit mobile popup without forcing the AI scroll open first', async () => {
    const wrapper = mountResult({
      initialP4Detail: {
        explainLines: ['INLINE_AI_COPY'],
        product: {
          productName: 'PRODUCT_NAME',
          productImage: 'product_sirloin_steak.png',
        },
        benefit: {
          claimButtonText: 'CLAIM_NOW',
          rewardCode: 'coupon_10',
          reward: {
            couponId: 'coupon_10',
            amountText: '10',
            unitText: '元券',
            couponName: '10元券',
          },
        },
      },
    })

    await wrapper.get('[data-testid="p2-claim-benefit"]').trigger('click')

    const popup = wrapper.get('[data-testid="p5-mobile-claim-popup"]')
    const input = wrapper.get('[data-testid="p5-mobile-input"]')
    expect(popup.exists()).toBe(true)
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('请输入手机号')
    expect(popup.text()).toContain('手机号')
    expect(popup.text()).not.toMatch(/[璇緭鎵満鍙]/)
    expect(wrapper.get('[data-testid="p2-ai-scroll"]').classes()).not.toContain('is-open')
    expect(wrapper.find('[data-testid="p2-ai-result"]').exists()).toBe(false)
  })

  it('reuses the combined result card when opening the legacy P4 route directly', () => {
    window.history.replaceState({}, '', '/activity/explain')

    const wrapper = mount(App, {
      props: {
        initialPage: 'p4',
        initialP4Detail: {
          explainLines: ['DIRECT_AI_COPY'],
          product: {
            productName: 'PRODUCT_NAME',
            productImage: 'product_tenderloin_steak.png',
          },
        },
      },
    })

    expect(wrapper.get('[data-testid="p2-combined-card"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="p2-ai-scroll"]').classes()).toContain('is-open')
    expect(wrapper.get('[data-testid="p2-ai-result"]').text()).toContain('DIRECT_AI_COPY')
  })

  it('opens a large QR preview from the rules page and closes it', async () => {
    const wrapper = mountRules()

    await wrapper.get('[data-testid="p7-qrcode-hotspot"]').trigger('click')

    const preview = wrapper.get('[data-testid="p7-qrcode-preview"]')
    expect(preview.isVisible()).toBe(true)
    expect(preview.find('img').attributes('src')).toContain('qrcode_wechat_group.png')
    expect(preview.find('strong').exists()).toBe(false)

    await wrapper.get('[data-testid="p7-qrcode-preview-close"]').trigger('click')

    expect(wrapper.find('[data-testid="p7-qrcode-preview"]').exists()).toBe(false)
  })

  it('keeps the enlarged QR preview on a clean white surface without clipping styles', () => {
    const css = readSource('src/style.css')

    expect(css).toMatch(/\.p7-qrcode-preview-mask\s*{[^}]*background:\s*#fff;/s)
    expect(css).toMatch(/\.p7-qrcode-preview-panel\s*{[^}]*width:\s*min\(78vw,\s*340px\);/s)
    expect(css).toMatch(/\.p7-qrcode-preview-image\s*{[^}]*object-fit:\s*contain;/s)
    expect(css).not.toMatch(/\.p7-qrcode-preview-image\s*{[^}]*box-shadow:/s)
  })

  it('uses the complete enterprise WeChat QR asset for the rules preview', () => {
    expect(readPngSize('public/assets/p7/qrcode_wechat_group.png')).toEqual({
      width: 396,
      height: 396,
    })
  })

  it('keeps P8 QR code, status, and WeChat layers when grand-prize qualification is locked', () => {
    const wrapper = mount(App, {
      props: {
        initialPage: 'p8',
        initialP8Prize: {
          qualification: {
            qualified: false,
            qualify_desc: 'LOCKED_DESC',
            prize_title: 'LOCKED_PRIZE',
            lottery_no: '',
          },
          lottery_status: {
            status: 'locked',
            status_text: 'LOCKED_STATUS',
            draw_time_desc: 'LOCKED_DRAW_TIME',
            notice: 'LOCKED_NOTICE',
            publicity_title: 'LOCKED_PUBLICITY',
            publicity_desc: 'LOCKED_PUBLICITY_DESC',
          },
          wechat_group: {
            qrcode_url: 'qrcode_grand_prize_wechat.png',
            qrcode_id: 'grand_prize_wechat_default',
            title: 'LOCKED_WECHAT_TITLE',
            benefits: ['LOCKED_WECHAT_BENEFIT'],
          },
        },
      },
    })

    expect(wrapper.get('[data-testid="p8-not-qualified"]').isVisible()).toBe(true)
    expect(wrapper.find('[data-testid="p8-lottery-no"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="p8-qrcode"]').find('img').attributes('src')).toContain(
      'qrcode_grand_prize_wechat.png',
    )
    expect(wrapper.text()).toContain('LOCKED_STATUS')
    expect(wrapper.text()).toContain('LOCKED_PUBLICITY_DESC')
    expect(wrapper.text()).toContain('LOCKED_WECHAT_BENEFIT')
  })

  it('keeps rewards page buttons flat without extra shadows', () => {
    const css = readSource('src/style.css')

    expect(css).toMatch(/\.p6-reward-action\s*{[^}]*box-shadow:\s*none;/s)
    expect(css).toMatch(/\.p6-back-button img,\s*\.p6-rule-button img,\s*\.p6-draw-again img,\s*\.p6-product-action img\s*{[^}]*filter:\s*none;/s)
  })

  it('keeps P6 reward action buttons compact on mobile cards', () => {
    const css = readSource('src/style.css')

    expect(css).toMatch(/\.p6-reward-action\s*{[^}]*width:\s*min\(58%,\s*72px\);/s)
    expect(css).toMatch(/\.p6-reward-action\s*{[^}]*min-height:\s*28px;/s)
    expect(css).toMatch(/\.p6-reward-action\s*{[^}]*font-size:\s*clamp\(12px,\s*3\.05vw,\s*13px\);/s)
    expect(css).toMatch(/\.p6-reward-action\s*{[^}]*letter-spacing:\s*0\.04em;/s)
    expect(css).toMatch(/@media \(max-height:\s*640px\)\s*{[\s\S]*?\.p6-reward-action\s*{[^}]*width:\s*min\(54%,\s*64px\);/s)
  })

  it('renders the rewards page copy without mojibake', () => {
    const wrapper = mount(App, {
      props: {
        initialPage: 'p6',
      },
    })
    const text = wrapper.text()

    expect(text).toContain('我的奖励')
    expect(text).toContain('我的考运进度')
    expect(text).toContain('已分享')
    expect(text).toContain('/5')
    expect(text).toContain('人')
    expect(text).toContain('精选好物推荐')
    expect(text).not.toMatch(/[\uFFFD\uE000-\uF8FF]|\u6d5c\?|\u5bb8\u63d2\u578e\u6d5c|\u93b4\u6220\u6b91|\u6fc2\u6827\u59f3|\u6769\u65bf\u6d16|\u5a32\u8bf2\u59e9|\u7eee\u9e43/)
  })

  it('configures the mobile viewport for safe-area webview rendering', () => {
    const html = readSource('index.html')

    expect(html).toContain('viewport-fit=cover')
    expect(html).toContain('interactive-widget=resizes-content')
  })

  it('adds mobile safe-area spacing and short-screen fallbacks', () => {
    const css = readSource('src/style.css')

    expect(css).toContain('--safe-top: env(safe-area-inset-top, 0px);')
    expect(css).toContain('--safe-bottom: env(safe-area-inset-bottom, 0px);')
    expect(css).toMatch(/\.home-page,\s*\.p2-page,\s*\.p4-page,\s*\.p6-page,\s*\.p7-page,\s*\.p8-page\s*{[^}]*padding-top:\s*var\(--safe-top\);/s)
    expect(css).toMatch(/\.modal-mask\s*{[^}]*padding:\s*max\(24px,\s*calc\(24px \+ var\(--safe-top\)\)\)\s*max\(24px,\s*calc\(24px \+ var\(--safe-right\)\)\)\s*max\(24px,\s*calc\(24px \+ var\(--safe-bottom\)\)\)\s*max\(24px,\s*calc\(24px \+ var\(--safe-left\)\)\);/s)
    expect(css).toMatch(/\.p5-popup-mask\s*{[^}]*padding:\s*max\(24px,\s*calc\(24px \+ var\(--safe-top\)\)\)\s*0\s*max\(24px,\s*calc\(24px \+ var\(--safe-bottom\)\)\);/s)
    expect(css).toMatch(/\.p6-page\s*{[^}]*padding-bottom:\s*calc\(96px \+ var\(--safe-bottom\)\);/s)
    expect(css).toMatch(/\.p7-qrcode-preview-mask\s*{[^}]*padding:\s*max\(56px,\s*calc\(56px \+ var\(--safe-top\)\)\)\s*max\(24px,\s*calc\(24px \+ var\(--safe-right\)\)\)\s*max\(32px,\s*calc\(32px \+ var\(--safe-bottom\)\)\)\s*max\(24px,\s*calc\(24px \+ var\(--safe-left\)\)\);/s)
    expect(css).not.toContain('local-api-debug-panel')
    expect(css).toMatch(/@media \(max-height:\s*640px\)\s*{/s)
  })

  it('does not render the local API debug pill on activity pages', () => {
    const wrapper = mountResult()

    expect(wrapper.find('[data-testid="local-api-debug-toggle"]').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('local-api-debug')
  })

  it('reports runtime warnings for missing page nodes, console warnings, and resource load failures', () => {
    document.body.innerHTML = '<main class="p2-page"><section data-testid="p2-combined-card"></section></main>'
    const reports = []
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const monitor = installRuntimeMonitor({
      getPageCode: () => 'p2',
      report: (eventName, payload) => reports.push({ eventName, payload }),
    })

    monitor.checkPageNodes()
    console.warn('asset warning', { code: 'missing' })
    const image = document.createElement('img')
    image.src = '/assets/missing.png'
    document.body.appendChild(image)
    image.dispatchEvent(new Event('error', { bubbles: true }))
    monitor.dispose()
    warnSpy.mockRestore()

    expect(reports.map((entry) => entry.eventName)).toContain('runtime_page_node_missing')
    expect(reports.map((entry) => entry.eventName)).toContain('runtime_console_warning')
    expect(reports.map((entry) => entry.eventName)).toContain('runtime_resource_load_error')
    expect(reports.find((entry) => entry.eventName === 'runtime_page_node_missing')?.payload.selector).toBe(
      '[data-testid="p2-product-image"]',
    )
  })

  it('opens the share guide and only rewards the first three shares each day', async () => {
    const wrapper = mountHome({ initialChance: 0 })

    await wrapper.get('[data-testid="share-entry"]').trigger('click')
    expect(wrapper.text()).toContain('分享引导')

    const shareComplete = wrapper.get('[data-testid="share-complete"]')
    await shareComplete.trigger('click')
    await shareComplete.trigger('click')
    await shareComplete.trigger('click')
    await shareComplete.trigger('click')

    expect(wrapper.text()).toContain('我的摇签机会 3次')
    expect(wrapper.text()).toContain('今日分享奖励 3/3')
  })
})
