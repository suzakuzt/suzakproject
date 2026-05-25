import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from './App.vue'
import { MINI_PROGRAM_COUPON_PAGE, goMiniProgramCouponPage } from './utils/miniProgramBridge'
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

const flushPromises = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('P1 activity home', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    delete window.wx
  })

  it('loads the WeChat JS-SDK for mini-program web-view navigation', () => {
    const html = readSource('index.html')

    expect(html).toContain('https://res.wx.qq.com/open/js/jweixin-1.6.0.js')
  })

  it('navigates to the mini-program coupon page only when the web-view bridge exists', () => {
    const navigateTo = vi.fn()
    window.wx = {
      miniProgram: {
        navigateTo,
      },
    }

    expect(goMiniProgramCouponPage()).toBe(true)
    expect(navigateTo).toHaveBeenCalledWith({ url: MINI_PROGRAM_COUPON_PAGE })

    delete window.wx
    expect(goMiniProgramCouponPage()).toBe(false)
  })

  it('uses the real mini-program my-coupon page path for coupon targets', () => {
    const files = [
      'src/composables/useP1Activity.js',
      'database/sqlite/002_seed_basic_mock_config.sql',
      'database/mysql/002_seed_basic_mock_config.sql',
    ]
    const contents = files.map(readSource).join('\n')
    const legacyCouponPage = ['/pages', `coupon${String.fromCharCode(45)}package`, 'index'].join('/')

    expect(contents).toContain('/pages/my-coupon/index')
    expect(contents).not.toContain(legacyCouponPage)
  })

  it('renders the confirmed P1 home copy with one default draw chance', () => {
    const wrapper = mountHome()

    expect(wrapper.text()).toContain('立即摇签')
    expect(wrapper.text()).toContain('我的摇签机会 1次')
    expect(wrapper.text()).toContain('活动规则')
    expect(wrapper.get('[data-testid="home-rewards-entry"]').text()).toBe('每日打卡')
    expect(wrapper.text()).toContain('分享获取次数')
    expect(wrapper.text()).not.toContain('今日已摇签')
  })

  it('renders five restrained golden reward barrage items on home', () => {
    const wrapper = mountHome()
    const items = wrapper.findAll('[data-testid="home-barrage-item"]')
    const rewardPattern = /^\d{3}\*{5}\d{3}\u62bd\u4e2d\d+(?:\.\d+)?(?:\u5143|\u6298)\u4f18\u60e0\u5238$/
    const realCarrierPrefixes = new Set(['130', '138', '158', '186', '189'])
    const prefixes = items.map((item) => item.text().slice(0, 3))
    const rewardTypes = items.map((item) =>
      item.text().replace(/^\d{3}\*{5}\d{3}\u62bd\u4e2d/, '').replace(/\u4f18\u60e0\u5238$/, ''),
    )

    expect(wrapper.get('[data-testid="home-barrage"]').attributes('aria-hidden')).toBe('true')
    expect(items).toHaveLength(5)
    expect(items[0].text()).toBe('138*****438\u62bd\u4e2d10\u5143\u4f18\u60e0\u5238')
    expect(prefixes.every((prefix) => realCarrierPrefixes.has(prefix))).toBe(true)
    expect(rewardTypes).toEqual(['10\u5143', '20\u5143', '30\u5143', '9\u6298', '7.5\u6298'])
    expect(items.map((item) => item.text())).not.toContain('177*****219\u62bd\u4e2d7.5\u6298\u4f18\u60e0\u5238')
    expect(items.every((item) => rewardPattern.test(item.text()))).toBe(true)
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

  it('shows the text wordmark on home and removes Prime Cuts stamp images from other pages', () => {
    const home = mountHome()
    const result = mountResult()
    const rewards = mount(App, { props: { initialPage: 'p6' } })

    const wordmark = home.get('[data-testid="brand-wordmark-home"]')
    expect(home.find('[data-testid="brand-logo-home"]').exists()).toBe(false)
    expect(wordmark.text()).not.toContain('1870s')
    expect(wordmark.text()).toContain('Prime')
    expect(wordmark.text()).toContain('Cuts')
    expect(home.get('.home-brand-wordmark-sub').text()).toBe('\u749e\u83b1\u7267')
    expect(result.find('[data-testid="brand-logo-result"]').exists()).toBe(false)
    expect(rewards.find('[data-testid="brand-logo-rewards"]').exists()).toBe(false)
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
    expect(css).not.toContain('.brand-logo')
    expect(css).toMatch(/\.home-brand-wordmark\s*{[^}]*width:\s*18\.5%;/s)
    expect(css).toMatch(/\.home-brand-wordmark\s*{[^}]*background:\s*transparent;/s)
    expect(css).toMatch(/\.home-brand-wordmark\s*{[^}]*border:\s*0;/s)
    expect(css).toMatch(/\.home-barrage\s*{[^}]*top:\s*28\.2%;[^}]*height:\s*12\.8%;/s)
    expect(css).toMatch(/\.home-barrage-item\s*{[^}]*color:\s*#f8d982;[^}]*animation:\s*home-barrage-scroll/s)
    expect(css).toMatch(/@keyframes home-barrage-scroll[\s\S]*left:\s*-86%;[\s\S]*left:\s*106%;/)
    expect(css).toContain('font-size: clamp(8px, 2.4vw, 11px);')
    expect(css).toMatch(/\.home-brand-wordmark-main\s*{[^}]*font-family:\s*Georgia/s)
    expect(css).toMatch(/\.home-brand-wordmark-main\s*{[^}]*color:\s*#fff;/s)
    expect(css).toMatch(/\.home-brand-wordmark-sub\s*{[^}]*font-family:\s*"Microsoft YaHei"/s)
    expect(css).toMatch(/\.home-brand-wordmark-sub\s*{[^}]*font-size:\s*clamp\(8px,\s*2\.4vw,\s*11px\);/s)
    expect(css).toMatch(/\.home-brand-wordmark-sub\s*{[^}]*color:\s*#fff;/s)
    expect(css).not.toContain('.p2-brand-logo')
    expect(css).not.toContain('.p6-brand-logo')
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
    expect(wrapper.get('[data-testid="share-poster"]').text()).toBe('分享得好礼')
  })

  it('keeps the result-page claim button visible after claim and removes the daily check-in entry', () => {
    const wrapper = mountResult({
      initialP4Detail: {
        benefit: {
          claimStatus: 'claimed',
        },
      },
    })

    expect(wrapper.get('[data-testid="p2-claim-benefit"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="p4-rewards-entry"]').exists()).toBe(false)
  })

  it('opens the activity share poster with QR code but without the product image', async () => {
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
    expect(poster.find('[data-testid="p2-share-activity-poster"]').attributes('src')).toContain(
      'share_activity_poster.png',
    )
    expect(poster.find('[data-testid="p2-poster-qrcode"]').attributes('src')).toContain('qrcode_wechat_group.png')
    expect(poster.find('[data-testid="p2-product-image"]').exists()).toBe(false)
    expect(poster.html()).not.toContain('product_flat_iron_steak.png')
    expect(poster.text()).not.toContain('海报')
    expect(poster.get('[data-testid="save-p2-poster"]').text()).toBe('保存')
    expect(poster.get('[data-testid="close-p2-panel"]').attributes('aria-label')).toBe('关闭')

    await poster.get('[data-testid="close-p2-panel"]').trigger('click')

    expect(wrapper.find('[data-testid="p2-poster-dialog"]').exists()).toBe(false)
  })

  it('saves the home share poster through the poster API and local download flow', async () => {
    const imageDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='
    const savePoster = vi.fn().mockResolvedValue({
      success: true,
      saved: true,
      poster_id: 'home_poster_test',
      poster_url: '/api/poster/image/home_poster_test',
    })
    const createSession = vi.fn().mockResolvedValue({ session_token: 'sess_home' })
    const trackEvent = vi.fn().mockResolvedValue({ success: true })
    const canvasContext = {
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      save: vi.fn(),
      scale: vi.fn(),
    }
    const originalImage = globalThis.Image
    const originalToBlob = HTMLCanvasElement.prototype.toBlob
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext)
    const toDataUrlSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(imageDataUrl)
    const anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:home-poster')
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => callback(new Blob(['png'], { type: 'image/png' })))
    globalThis.Image = class {
      set src(value) {
        this._src = value
        setTimeout(() => this.onload?.(), 0)
      }
    }
    const wrapper = mountHome({
      apiClient: { createSession, savePoster, trackEvent },
    })

    await wrapper.get('[data-testid="share-entry"]').trigger('click')
    await wrapper.get('[data-testid="save-home-share-poster"]').trigger('click')
    await flushPromises()

    expect(savePoster).toHaveBeenCalledWith(
      expect.objectContaining({
        session_token: 'sess_home',
        page_code: 'home',
        poster_type: 'home_share',
        image_data_url: imageDataUrl,
      }),
    )
    expect(anchorClickSpy).toHaveBeenCalled()
    expect(wrapper.get('[data-testid="home-share-poster-save-message"]').text()).toContain('海报已保存')
    expect(wrapper.get('[data-testid="home-share-generated-preview"]').attributes('src')).toBe(
      '/api/poster/image/home_poster_test',
    )

    wrapper.unmount()
    globalThis.Image = originalImage
    HTMLCanvasElement.prototype.toBlob = originalToBlob
    getContextSpy.mockRestore()
    toDataUrlSpy.mockRestore()
    anchorClickSpy.mockRestore()
    createObjectUrlSpy.mockRestore()
    revokeObjectUrlSpy.mockRestore()
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
    expect(css).toMatch(/\.p2-poster-dialog\s*{[^}]*width:\s*min\(84vw,\s*332px\);/s)
    expect(css).toMatch(/\.p2-poster-card\s*{[^}]*background:\s*#a10805;[^}]*overflow:\s*hidden;/s)
    expect(css).toMatch(/\.activity-share-poster-image\s*{[^}]*aspect-ratio:\s*941\s*\/\s*1672;/s)
    expect(css).toMatch(/\.activity-share-poster-qrcode\s*{[^}]*left:\s*15%;[^}]*top:\s*84\.7%;[^}]*width:\s*21\.2%;/s)
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

  it('redirects to the mini-program my-coupon page after a successful mobile claim', async () => {
    const navigateTo = vi.fn()
    window.wx = {
      miniProgram: {
        navigateTo,
      },
    }
    const createSession = vi.fn().mockResolvedValue({ session_token: 'sess_test' })
    const claimBenefit = vi.fn().mockResolvedValue({
      claimStatus: 'claimed',
      receiver_mobile_masked: '138****8000',
      reward: {
        couponId: 'coupon_10',
        couponName: '10元券',
        couponStatus: 'unused',
      },
      action: {
        type: 'mini_program_coupon_package',
        target: '/unused-backend-target',
      },
    })
    const wrapper = mountResult({
      apiClient: {
        createSession,
        claimBenefit,
        trackEvent: vi.fn().mockResolvedValue({}),
      },
      initialP4Detail: {
        benefit: {
          rewardCode: 'coupon_10',
        },
      },
    })

    await wrapper.get('[data-testid="p2-claim-benefit"]').trigger('click')
    await wrapper.get('[data-testid="p5-mobile-input"]').setValue('13800138000')
    await wrapper.get('[data-testid="p5-submit-claim"]').trigger('submit')
    await flushPromises()

    expect(claimBenefit).toHaveBeenCalledWith(
      expect.objectContaining({
        session_token: 'sess_test',
        mobile: '13800138000',
        claim_channel: 'h5',
      }),
    )
    expect(navigateTo).toHaveBeenCalledWith({ url: MINI_PROGRAM_COUPON_PAGE })
  })

  it('shows a successful claim hint instead of redirecting outside mini-program web-view', async () => {
    const createSession = vi.fn().mockResolvedValue({ session_token: 'sess_test' })
    const claimBenefit = vi.fn().mockResolvedValue({
      claimStatus: 'claimed',
      receiver_mobile_masked: '138****8000',
      reward: {
        couponId: 'coupon_10',
        couponName: '10元券',
        couponStatus: 'unused',
      },
    })
    const wrapper = mountResult({
      apiClient: {
        createSession,
        claimBenefit,
        trackEvent: vi.fn().mockResolvedValue({}),
      },
      initialP4Detail: {
        benefit: {
          rewardCode: 'coupon_10',
        },
      },
    })

    await wrapper.get('[data-testid="p2-claim-benefit"]').trigger('click')
    await wrapper.get('[data-testid="p5-mobile-input"]').setValue('13800138000')
    await wrapper.get('[data-testid="p5-submit-claim"]').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('领取成功，请前往小程序我的优惠券查看')
  })

  it('does not redirect to the coupon page when mobile claim fails', async () => {
    const navigateTo = vi.fn()
    window.wx = {
      miniProgram: {
        navigateTo,
      },
    }
    const createSession = vi.fn().mockResolvedValue({ session_token: 'sess_test' })
    const claimBenefit = vi.fn().mockRejectedValue(new Error('手机号已领取过'))
    const wrapper = mountResult({
      apiClient: {
        createSession,
        claimBenefit,
        trackEvent: vi.fn().mockResolvedValue({}),
      },
      initialP4Detail: {
        benefit: {
          rewardCode: 'coupon_10',
        },
      },
    })

    await wrapper.get('[data-testid="p2-claim-benefit"]').trigger('click')
    await wrapper.get('[data-testid="p5-mobile-input"]').setValue('13800138000')
    await wrapper.get('[data-testid="p5-submit-claim"]').trigger('submit')
    await flushPromises()

    expect(navigateTo).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('手机号已领取过')
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

  it('uses the enterprise WeChat QR asset on the P8 prize page', () => {
    const p8Qrcode = readFileSync(resolve(process.cwd(), 'public/assets/p8/qrcode_grand_prize_wechat.png'))
    const enterpriseWechatQrcode = readFileSync(resolve(process.cwd(), 'public/assets/p7/qrcode_wechat_group.png'))

    expect(p8Qrcode.equals(enterpriseWechatQrcode)).toBe(true)
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

  it('renders the P8 locked qualification copy without mojibake', () => {
    const wrapper = mount(App, {
      props: {
        initialPage: 'p8',
        initialP8Prize: {
          qualification: {
            qualified: false,
            qualify_desc: '分享5个好友，或累计点亮7天，赢取985和牛礼盒抽奖资格！',
            prize_title: '985 和牛礼盒',
            lottery_no: '',
          },
        },
      },
    })
    const text = wrapper.text()

    expect(text).toContain('大奖资格暂未解锁')
    expect(text).toContain('返回我的奖励')
    expect(text).not.toMatch(/澶у|杩斿|閹|闁|鎴戠殑濂栧姳/)
  })

  it('keeps the P8 lottery number slot empty when no lottery number exists', () => {
    const wrapper = mount(App, {
      props: {
        initialPage: 'p8',
        initialP8Prize: {
          qualification: {
            qualified: false,
            qualify_desc: '分享5个好友，或累计点亮7天，赢取985和牛礼盒抽奖资格！',
            prize_title: '985 和牛礼盒',
            lottery_no: '',
          },
        },
      },
    })

    expect(wrapper.find('.p8-status-lottery-no').text()).toBe('')
    expect(wrapper.text()).not.toContain('抽奖编号生成中，请稍后刷新')
  })

  it('keeps P8 fallback prize copy free of mojibake at the source', () => {
    const source = readSource('src/composables/useP1Activity.js')
    const initialP8Defaults = source.slice(
      source.indexOf('const DEFAULT_P8_PRIZE = {'),
      source.indexOf('Object.assign(DEFAULT_P7_RULES'),
    )
    const p8Overrides = source.slice(
      source.indexOf('Object.assign(DEFAULT_P8_PRIZE'),
      source.indexOf('const normalizeP2Result'),
    )
    const p8Source = `${initialP8Defaults}\n${p8Overrides}`

    expect(p8Source).toContain('牛气大奖资格已确认')
    expect(p8Source).not.toMatch(/閹|闁|缁|濞|娑|鐗|瀵|鏉|顨|绱|鍩\?|鐗\?|\?\?\?/)
  })

  it('keeps P7 fallback rules copy free of mojibake at the source', () => {
    const source = readSource('src/composables/useP1Activity.js')
    const initialP7Defaults = source.slice(
      source.indexOf('const DEFAULT_P7_RULES = {'),
      source.indexOf('const DEFAULT_P8_PRIZE = {'),
    )
    const p7Overrides = source.slice(
      source.indexOf('Object.assign(DEFAULT_P7_RULES'),
      source.indexOf('Object.assign(DEFAULT_P8_PRIZE'),
    )
    const p7Source = `${initialP7Defaults}\n${p7Overrides}`

    expect(p7Source).toContain('活动规则')
    expect(p7Source).toContain('用户每日默认获得 1 次抽签机会。')
    expect(p7Source).toContain('扫码添加企微')
    expect(p7Source).not.toMatch(/闁|閹|濞|娑|杩斿|\?\?\?/)
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

  it('opens the home share poster with close and save controls only', async () => {
    const wrapper = mountHome({ initialChance: 0 })

    await wrapper.get('[data-testid="share-entry"]').trigger('click')
    expect(wrapper.text()).toContain('分享引导')
    expect(wrapper.get('[data-testid="home-share-activity-poster"]').find('.activity-share-poster-image').attributes('src')).toContain(
      'share_activity_poster.png',
    )
    expect(wrapper.get('[data-testid="home-share-qrcode"]').attributes('src')).toContain('qrcode_wechat_group.png')
    expect(wrapper.get('[data-testid="save-home-share-poster"]').text()).toBe('保存')
    expect(wrapper.get('[data-testid="close-share-guide"]').attributes('aria-label')).toBe('关闭')
    expect(wrapper.find('[data-testid="share-complete"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('模拟完成分享')
    expect(wrapper.text()).not.toContain('知道了')

    await wrapper.get('[data-testid="close-share-guide"]').trigger('click')

    expect(wrapper.find('[data-testid="home-share-poster-dialog"]').exists()).toBe(false)
  })
})
