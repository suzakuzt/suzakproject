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

const mountHome = (props = {}) => mount(App, { props })
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

    expect(html).toContain('bg_rank_success.png')
    expect(html).toContain('element_lottery_box.png')
    expect(html).toContain('btn_draw_now.png')
    expect(html).toContain('tag_activity_rules.png')
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
      width: 1960,
      height: 431,
    })
    expect(readPngSize('public/assets/home/element_lottery_box.png')).toEqual({
      width: 651,
      height: 985,
    })
  })

  it('keeps the P1 home layout relaxed around the lottery area', () => {
    const css = readSource('src/style.css')

    expect(css).toMatch(/\.rule-entry\s*{[^}]*top:\s*40\.5%;/s)
    expect(css).toMatch(/\.lottery-shadow\s*{[^}]*top:\s*63\.4%;[^}]*left:\s*53%;[^}]*width:\s*44%;[^}]*radial-gradient\(ellipse at 70% 58%/s)
    expect(css).toMatch(/\.lottery-tube\s*{[^}]*top:\s*37%;[^}]*width:\s*44%;/s)
    expect(css).toMatch(/\.lottery-tube img\s*{[^}]*filter:\s*drop-shadow\(11px 18px 16px rgba\(34,\s*0,\s*0,\s*0\.3\)\) saturate\(1\.02\) contrast\(0\.98\) brightness\(1\.02\) sepia\(0\.02\);/s)
    expect(css).toMatch(/\.draw-button\s*{[^}]*top:\s*82\.5%;[^}]*width:\s*66%;/s)
    expect(css).toMatch(/\.bottom-nav\s*{[^}]*bottom:\s*2\.4%;/s)
  })

  it('keeps color treatment scoped to the lottery tube area', () => {
    const css = readSource('src/style.css')

    expect(css).toContain('--tube-red-brown: #b80606;')
    expect(css).toContain('--tube-warm-gold: #c58a3a;')
    expect(css).not.toContain('.home-stage::before')
    expect(css).toMatch(/\.lottery-tube::before\s*{[^}]*background:[^}]*var\(--tube-red-brown\)/s)
    expect(css).toMatch(/\.lottery-tube::before\s*{[^}]*background:[^}]*var\(--tube-warm-gold\)/s)
    expect(css).toMatch(/\.lottery-tube::after\s*{[^}]*linear-gradient\(\s*90deg,[^}]*rgba\(255,\s*92,\s*52,\s*0\.24\)[^}]*rgba\(48,\s*0,\s*0,\s*0\.3\)[^}]*mix-blend-mode:\s*soft-light;/s)
  })

  it('routes to the P2 placeholder when the primary draw button has chance', async () => {
    const wrapper = mountHome()

    await wrapper.get('[data-testid="draw-button"]').trigger('click')

    expect(wrapper.text()).toContain('P2 摇签动画页占位')
  })

  it('uses the same draw entrance when clicking the lottery tube', async () => {
    const wrapper = mountHome()

    await wrapper.get('[data-testid="lottery-tube"]').trigger('click')

    expect(wrapper.text()).toContain('P2 摇签动画页占位')
  })

  it('shows the no-chance tip instead of routing when draw chance is zero', async () => {
    const wrapper = mountHome({ initialChance: 0 })

    await wrapper.get('[data-testid="draw-button"]').trigger('click')

    expect(wrapper.text()).toContain('今日机会已用完，分享可再得机会')
    expect(wrapper.text()).not.toContain('P2 摇签动画页占位')
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
