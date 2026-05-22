import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from './App.vue'

vi.mock('./components/HelloWorld.vue', () => ({
  default: {
    template: '<div data-testid="vite-starter" />',
  },
}))

const mountHome = (props = {}) => {
  window.history.replaceState({}, '', '/activity/home')

  return mount(App, { props })
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

  it('keeps the P1 home layout relaxed around the lottery area', () => {
    const css = readSource('src/style.css')

    expect(css).toMatch(/\.rule-entry\s*{[^}]*top:\s*1\.9%;/s)
    expect(css).toMatch(/\.lottery-shadow\s*{[^}]*top:\s*66\.6%;[^}]*left:\s*53%;[^}]*width:\s*50%;[^}]*radial-gradient\(ellipse at 70% 58%/s)
    expect(css).toMatch(/\.lottery-tube\s*{[^}]*top:\s*39\.5%;[^}]*width:\s*68%;/s)
    expect(css).toMatch(/\.lottery-tube img\s*{[^}]*filter:\s*none;/s)
    expect(css).toMatch(/\.draw-button\s*{[^}]*top:\s*81\.4%;[^}]*width:\s*70%;/s)
    expect(css).toMatch(/\.bottom-nav\s*{[^}]*bottom:\s*2\.4%;/s)
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
    await wrapper.get('.draw-animation-video').trigger('ended')

    expect(wrapper.text()).toContain('六月考运签')
    expect(wrapper.text()).toContain('问小璞')
  })

  it('uses the same draw entrance when clicking the lottery tube', async () => {
    const wrapper = mountHome()

    await wrapper.get('[data-testid="lottery-tube"]').trigger('click')
    await wrapper.get('.draw-animation-video').trigger('ended')

    expect(wrapper.text()).toContain('六月考运签')
    expect(wrapper.text()).toContain('问小璞')
  })

  it('shows the no-chance tip instead of routing when draw chance is zero', async () => {
    const wrapper = mountHome({ initialChance: 0 })

    await wrapper.get('[data-testid="draw-button"]').trigger('click')

    expect(wrapper.text()).toContain('今日机会已用完，分享可再得机会')
    expect(wrapper.text()).not.toContain('六月考运签')
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
