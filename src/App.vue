<script setup>
import { computed } from 'vue'
import { useP1Activity } from './composables/useP1Activity'

const props = defineProps({
  initialChance: {
    type: Number,
    default: 1,
  },
  initialShareRewardCount: {
    type: Number,
    default: 0,
  },
})

const {
  closeShareGuide,
  completeShare,
  currentPage,
  drawChance,
  goHome,
  goRewards,
  goRules,
  handleDraw,
  openShareGuide,
  shareProgressText,
  showShareGuide,
  tipMessage,
} = useP1Activity(props)

const chanceText = computed(() => `我的摇签机会 ${drawChance.value}次`)
const homeAsset = (name) => `${import.meta.env.BASE_URL}assets/home/${name}`
const stageStyle = computed(() => ({
  backgroundImage: `url(${homeAsset('bg_rank_success.png')})`,
}))
</script>

<template>
  <main v-if="currentPage === 'home'" class="home-page" aria-label="P1 活动首页">
    <section class="home-stage" :style="stageStyle">
      <button class="rule-entry" type="button" aria-label="活动规则" @click="goRules">
        <img :src="homeAsset('tag_activity_rules.png')" alt="" />
        <span class="sr-only">活动规则</span>
      </button>

      <span class="lottery-shadow" aria-hidden="true"></span>

      <button
        class="lottery-tube"
        data-testid="lottery-tube"
        type="button"
        aria-label="点击签筒立即摇签"
        @click="handleDraw('tube')"
      >
        <img :src="homeAsset('element_lottery_box.png')" alt="" />
        <span class="sr-only">签筒</span>
      </button>

      <button
        class="draw-button"
        data-testid="draw-button"
        type="button"
        aria-label="立即摇签"
        @click="handleDraw('button')"
      >
        <img :src="homeAsset('btn_draw_now.png')" alt="" />
        <span class="sr-only">立即摇签</span>
      </button>

      <p v-if="tipMessage" class="chance-tip" role="alert">{{ tipMessage }}</p>

      <nav class="bottom-nav" aria-label="首页快捷入口">
        <button type="button" @click="goRewards">我的奖励</button>
        <p aria-live="polite">{{ chanceText }}</p>
        <button data-testid="share-entry" type="button" @click="openShareGuide">分享获取次数</button>
      </nav>
    </section>

    <div v-if="showShareGuide" class="modal-mask" role="presentation">
      <section class="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <h2 id="share-title">分享引导</h2>
        <p>分享完成后可获得 1 次摇签机会，每日最多奖励 3 次。</p>
        <strong>{{ shareProgressText }}</strong>
        <div class="dialog-actions">
          <button data-testid="share-complete" type="button" @click="completeShare">模拟完成分享</button>
          <button type="button" @click="closeShareGuide">知道了</button>
        </div>
      </section>
    </div>
  </main>

  <section v-else-if="currentPage === 'p2'" class="placeholder-page">
    <h1>P2 摇签动画页占位</h1>
    <p>这里后续接入摇签动画和真实抽签流程。</p>
    <button type="button" @click="goHome">返回首页</button>
  </section>

  <section v-else-if="currentPage === 'rules'" class="placeholder-page">
    <h1>活动规则页占位</h1>
    <p>这里后续接入活动规则独立页面。</p>
    <button type="button" @click="goHome">返回首页</button>
  </section>

  <section v-else class="placeholder-page">
    <h1>P6 我的奖励页占位</h1>
    <p>这里后续接入我的考运进度和奖励信息。</p>
    <button type="button" @click="goHome">返回首页</button>
  </section>
</template>
