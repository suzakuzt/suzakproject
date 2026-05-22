<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useP1Activity } from './composables/useP1Activity'

const props = defineProps({
  initialPage: {
    type: String,
    default: undefined,
  },
  initialChance: {
    type: Number,
    default: 1,
  },
  initialShareRewardCount: {
    type: Number,
    default: 0,
  },
  initialP2Result: {
    type: Object,
    default: undefined,
  },
  initialP2Status: {
    type: String,
    default: 'success',
  },
  initialP4Detail: {
    type: Object,
    default: undefined,
  },
  initialP4Status: {
    type: String,
    default: 'success',
  },
  initialP5Result: {
    type: Object,
    default: undefined,
  },
  initialP6Center: {
    type: Object,
    default: undefined,
  },
  initialP6Status: {
    type: String,
    default: 'success',
  },
  initialP7Rules: {
    type: Object,
    default: undefined,
  },
  initialP8Prize: {
    type: Object,
    default: undefined,
  },
  apiClient: {
    type: Object,
    default: undefined,
  },
})

const queryParams = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search)
const queryInitialPage = queryParams.get('page') ?? undefined
const queryShareToken = queryParams.get('share_token') ?? undefined
const pathInitialPage = typeof window === 'undefined' ? undefined : window.location.pathname

const {
  closeP5ClaimSuccess,
  closeP2Panel,
  closeShareGuide,
  completeDrawAnimation,
  completeShare,
  currentPage,
  drawAnimationStatus,
  drawChance,
  failDrawAnimation,
  goHome,
  goP2Back,
  goP4Back,
  goRewards,
  goRules,
  handleDraw,
  isDrawTemporarilyDisabled,
  openP2Explain,
  openP2Poster,
  openShareGuide,
  p2Panel,
  p2Result,
  p2Status,
  p4ClaimMessage,
  p4ClaimStatus,
  p4Detail,
  p4VisibleThinkingLines,
  p4Status,
  p5ClaimStatus,
  p5Mobile,
  p5MobileError,
  p5Result,
  p5UseMessage,
  p5UseStatus,
  p6ActionMessage,
  p6ActionStatus,
  p6Center,
  p6Status,
  p7Rules,
  p8Prize,
  claimP4Benefit,
  drawAgainFromP6,
  goP8Back,
  goP7Back,
  goP6Back,
  openP6Product,
  openP6Rules,
  retryP4Detail,
  retryP6Center,
  retryP2Result,
  shareProgressText,
  showDrawAnimation,
  showShareGuide,
  showP5ClaimSuccess,
  tipMessage,
  trackP7QrcodeClick,
  trackP7QrcodeLoadFail,
  trackP7ScrollToBottom,
  trackP8QrcodeClick,
  trackP8QrcodeLoadFail,
  useP6Reward,
  useP5Benefit,
  focusP5MobileInput,
  submitP5MobileClaim,
} = useP1Activity({
  ...props,
  initialPage: props.initialPage ?? queryInitialPage ?? pathInitialPage,
  shareToken: queryShareToken,
})

const chanceText = computed(() => `我的摇签机会 ${drawChance.value}次`)
const homeAsset = (name) => `${import.meta.env.BASE_URL}assets/home/${name}`
const drawAnimationWebmSrc = homeAsset('CQ2-transparent-3s.webm')
const drawAnimationVideoSrc = homeAsset('CQ2-3s.mp4')
const p2Asset = (name) => `${import.meta.env.BASE_URL}assets/p2/${name}`
const p4Asset = (name) => `${import.meta.env.BASE_URL}assets/p4/${name}`
const p5Asset = (name) => `${import.meta.env.BASE_URL}assets/p5/${name}`
const p6Asset = (name) => `${import.meta.env.BASE_URL}assets/p6/${name}`
const p7Asset = (name) => `${import.meta.env.BASE_URL}assets/p7/${name}`
const p8Asset = (name) => `${import.meta.env.BASE_URL}assets/p8/${name}`
const P5_FALLBACK_COUPON_IMAGE = 'element_coupon_20yuan_card.png'
const stageStyle = computed(() => ({
  backgroundImage: `url(${homeAsset('bg_rank_success.jpg')})`,
}))
const playDrawAnimation = (event) => {
  event.currentTarget?.play?.().catch(() => {})
}
const p2StageStyle = computed(() => ({
  backgroundImage: `url(${p2Asset('bg_sign_page_clean.jpg')})`,
}))
const p4StageStyle = computed(() => ({
  backgroundImage: `url(${p4Asset('bg_ai_result_page.jpg')})`,
}))
const p6StageStyle = computed(() => ({
  backgroundImage: `url(${p6Asset('bg_exam_progress_page.jpg')})`,
}))
const p7StageStyle = computed(() => ({
  backgroundImage: `url(${p7Asset('bg_activity_rules_page.png')})`,
}))
const p8StageStyle = computed(() => ({
  backgroundImage: `url(${p8Asset('bg_checkin_reward_result_page.png')})`,
}))
const p2SignTag = computed(() => `${p2Result.value.signType} · ${p2Result.value.signLevel}`)
const splitGlyphs = (text = '') => Array.from(text)
const P2_SIDE_COMFORT_GLYPH_LIMIT = 10
const P2_SIDE_MAX_GLYPH_LIMIT = 12
const getP2SideGlyphs = (text = '') =>
  splitGlyphs(text).filter((char) => !['、', '，', '。', '；', '：', ',', ';', ':', ' '].includes(char))
const splitSideGlyphs = (text = '') => {
  const glyphs = getP2SideGlyphs(text)

  return glyphs.length > P2_SIDE_MAX_GLYPH_LIMIT ? glyphs.slice(0, P2_SIDE_COMFORT_GLYPH_LIMIT) : glyphs
}
const getP2SideCopyClass = (text = '') => {
  const glyphCount = getP2SideGlyphs(text).length

  return {
    'is-dense': glyphCount > P2_SIDE_COMFORT_GLYPH_LIMIT,
    'is-clipped': glyphCount > P2_SIDE_MAX_GLYPH_LIMIT,
  }
}
const p2MainColumns = computed(() =>
  p2Result.value.mainTextColumns.map((text, index) => ({
    id: `${index}-${text}`,
    text,
    chars: splitGlyphs(text),
  })),
)
const p2GoodForChars = computed(() => splitSideGlyphs(p2Result.value.goodFor))
const p2AvoidChars = computed(() => splitSideGlyphs(p2Result.value.avoid))
const p2PanelTitle = computed(() => (p2Panel.value === 'poster' ? '分享海报占位' : '今日解签内容'))
const p2PanelText = computed(() => {
  if (p2Panel.value === 'poster') {
    return '后续接入 POST /api/poster/generate，生成当前签文分享海报。'
  }

  return `${p2Result.value.explainText} 后续接入 GET /api/explain/detail。`
})
const showLocalApiDebugPanel = import.meta.env.DEV
const debugPanelExpanded = ref(false)
const debugApiEntries = ref([])
const formatDebugApiUrl = (url) => {
  try {
    const parsed = new URL(url)
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}
const handleDebugApiLog = (event) => {
  const entry = event.detail ?? {}
  debugApiEntries.value = [
    {
      ...entry,
      displayUrl: formatDebugApiUrl(entry.url ?? ''),
    },
    ...debugApiEntries.value,
  ].slice(0, 8)
}
const latestDebugEntry = computed(() => debugApiEntries.value[0])
const debugPanelSummary = computed(() => {
  if (!latestDebugEntry.value) {
    return '待命'
  }

  return `${latestDebugEntry.value.method} ${latestDebugEntry.value.status}`
})
const p4ProductImageFailed = ref(false)
const resolveP4ProductImage = (image) => {
  if (!image || p4ProductImageFailed.value) {
    return p4Asset('card_beef_photo.png')
  }

  if (image.startsWith('http') || image.startsWith('/')) {
    return image
  }

  return p4Asset(image)
}
const p4ProductImageSrc = computed(() => resolveP4ProductImage(p4Detail.value.product.productImage))
const resolveP5CouponImage = (reward) => {
  const image = reward?.imageUrl ?? reward?.image_url ?? reward?.rewardImageUrl ?? reward?.reward_image_url
  if (image) {
    return image.startsWith('http') || image.startsWith('/') ? image : p5Asset(image)
  }

  return p5Asset(P5_FALLBACK_COUPON_IMAGE)
}
const p5CouponImageSrc = computed(() => resolveP5CouponImage(p5Result.value.reward))
const p4ClaimButtonText = computed(() => {
  if (p4ClaimStatus.value === 'claiming') {
    return '领取中'
  }
  if (p4ClaimStatus.value === 'claimed') {
    return '已领取'
  }

  return p4Detail.value.benefit.claimButtonText || '领取专属福利'
})
const p4ClaimButtonDisabled = computed(() => p4Status.value !== 'success' || p4ClaimStatus.value === 'claiming')
const shouldShowP4ClaimButton = computed(() => p4ClaimStatus.value !== 'claimed')
const p4ClaimTipText = computed(() => p4ClaimMessage.value)
const handleP4ProductImageError = () => {
  p4ProductImageFailed.value = true
}
const p5UseButtonText = computed(() => {
  if (p5UseStatus.value === 'redirecting') {
    return '跳转中'
  }

  return p5Result.value.action.buttonText || '去使用'
})
const p5UseButtonDisabled = computed(
  () => p5UseStatus.value === 'redirecting' || p5Result.value.reward.couponStatus !== 'unused',
)
const isP5Claimed = computed(() => p5Result.value.claimStatus === 'claimed')
const p5PrimaryButtonText = computed(() => {
  if (p5ClaimStatus.value === 'submitting') {
    return '领取中...'
  }

  return isP5Claimed.value ? p5UseButtonText.value : '去领取'
})
const p5PrimaryButtonDisabled = computed(
  () => p5ClaimStatus.value === 'submitting' || (isP5Claimed.value && p5UseButtonDisabled.value),
)
const handleP5PrimaryAction = () => {
  if (isP5Claimed.value) {
    useP5Benefit()
    return
  }

  submitP5MobileClaim()
}
const p6ProductImageFailed = ref(false)
const p7QrcodeFailed = ref(false)
const p8QrcodeFailed = ref(false)
const p6Progress = computed(() => p6Center.value.progress)
const p6ShareCount = computed(() => Number(p6Progress.value.shared_count) || 0)
const p6ShareTarget = computed(() => Number(p6Progress.value.share_target) || 5)
const p6CompletedDays = computed(() => new Set(p6Progress.value.completed_days ?? []))
const p6ProgressDays = computed(() => {
  const total = Number(p6Progress.value.light_target) || 7

  return Array.from({ length: total }, (_, index) => {
    const day = index + 1

    return {
      day,
      complete: p6CompletedDays.value.has(day),
    }
  })
})
const p6RewardCards = computed(() => p6Center.value.display_rewards ?? [
  ...(p6Center.value.claimed_rewards ?? []).slice(0, 5),
  p6Center.value.gift_reward,
])
const p6RewardGridClass = computed(() => ({
  'is-two-row': p6RewardCards.value.length > 3,
}))
const p6Product = computed(() => p6Center.value.product_recommend)
const p6DrawAgainButtonText = computed(() => p6Center.value.draw_again_action.button_text || '再抽一次')

const normalizeP6RewardTitle = (reward) => String(reward?.title ?? '').replace(/\s/g, '')
const resolveP6RewardImageName = (reward) => {
  if (reward?.image_url) {
    return reward.image_url
  }

  if (reward?.reward_type === 'gift_lottery_qualification') {
    return 'product_gift_box.png'
  }

  const title = normalizeP6RewardTitle(reward)

  if (reward?.reward_type === 'discount_coupon') {
    if (title.includes('7.5')) {
      return 'element_coupon_75off_card.png'
    }
    if (title.includes('9')) {
      return 'element_coupon_9off_card.png'
    }
  }

  if (title.includes('30')) {
    return 'element_coupon_30yuan_card.png'
  }
  if (title.includes('20')) {
    return 'element_coupon_20yuan_card.png'
  }
  if (title.includes('10')) {
    return 'element_coupon_10yuan_card.png'
  }

  return ''
}
const resolveP6AssetUrl = (value) => {
  if (!value) {
    return ''
  }

  if (value.startsWith('http') || value.startsWith('/')) {
    return value
  }

  return p6Asset(value)
}
const resolveP6RewardImage = (reward) => resolveP6AssetUrl(resolveP6RewardImageName(reward))
const resolveP6ProductImage = (image) => {
  if (!image || p6ProductImageFailed.value) {
    return p4Asset('card_beef_photo.png')
  }

  if (image.startsWith('http') || image.startsWith('/')) {
    return image
  }

  return image.startsWith('card_') ? p4Asset(image) : p6Asset(image)
}
const p6ProductImageSrc = computed(() => resolveP6ProductImage(p6Product.value?.image_url))
const p7QrcodeSrc = computed(() => {
  const qrcode = p7Rules.value.wechat_group.qrcode_url

  if (!qrcode || p7QrcodeFailed.value) {
    return ''
  }

  if (qrcode.startsWith('http') || qrcode.startsWith('/')) {
    return qrcode
  }

  return p7Asset(qrcode)
})
const p8HeroLines = computed(() => String(p8Prize.value.hero.title ?? '').split(/\n/).filter(Boolean))
const p8Qualification = computed(() => p8Prize.value.qualification)
const p8LotteryStatus = computed(() => p8Prize.value.lottery_status)
const p8WechatGroup = computed(() => p8Prize.value.wechat_group)
const p8LotteryNoText = computed(() => p8Qualification.value.lottery_no || '抽奖编号生成中，请稍后刷新')
const p8QrcodeSrc = computed(() => {
  const qrcode = p8WechatGroup.value.qrcode_url

  if (!qrcode || p8QrcodeFailed.value) {
    return ''
  }

  if (qrcode.startsWith('http') || qrcode.startsWith('/')) {
    return qrcode
  }

  return p8Asset(qrcode)
})
const isP6GiftReward = (reward) => reward?.reward_type === 'gift_lottery_qualification'
const isP6RewardPending = (reward) => !isP6GiftReward(reward) && reward?.status !== 'unused'
const isP6RewardDisabled = (reward) => isP6RewardPending(reward)
const getP6RewardActionTestId = (reward) => (isP6GiftReward(reward) ? 'p6-gift-action' : 'p6-reward-action')
const getP6RewardButtonText = (reward) => {
  if (isP6GiftReward(reward)) {
    return ['qualified', 'unused'].includes(reward?.status) ? '\u53bb\u4f7f\u7528' : reward?.button_text || ''
  }

  if (reward?.status === 'unused') {
    return '\u53bb\u9886\u53d6'
  }

  if (reward?.status === 'unclaimed') {
    return '\u672a\u9886\u53d6'
  }

  return reward?.button_text || '\u5f85\u62bd\u53d6'
}
const handleP6ProductImageError = () => {
  p6ProductImageFailed.value = true
}
const handleP7QrcodeError = () => {
  p7QrcodeFailed.value = true
  trackP7QrcodeLoadFail()
}
const handleP8QrcodeError = () => {
  p8QrcodeFailed.value = true
  trackP8QrcodeLoadFail()
}

watch(currentPage, () => {
  requestAnimationFrame(() => {
    const scroller = document.scrollingElement || document.documentElement
    if (scroller) {
      scroller.scrollTop = 0
      scroller.scrollLeft = 0
    }
    document.body.scrollTop = 0
    document.body.scrollLeft = 0
  })
})

watch(p4Detail, () => {
  p4ProductImageFailed.value = false
})

watch(p6Center, () => {
  p6ProductImageFailed.value = false
})

watch(p7Rules, () => {
  p7QrcodeFailed.value = false
})

watch(p8Prize, () => {
  p8QrcodeFailed.value = false
})

onMounted(() => {
  if (showLocalApiDebugPanel && typeof window !== 'undefined') {
    window.addEventListener('gaokao-h5-api-log', handleDebugApiLog)
  }
})

onBeforeUnmount(() => {
  if (showLocalApiDebugPanel && typeof window !== 'undefined') {
    window.removeEventListener('gaokao-h5-api-log', handleDebugApiLog)
  }
})
</script>

<template>
  <main v-if="currentPage === 'home'" class="home-page" aria-label="P1 活动首页">
    <section class="home-stage" :style="stageStyle">
      <button class="rule-entry" type="button" aria-label="活动规则" @click="goRules">
        <img :src="p6Asset('btn_activity_rules.png')" alt="" />
        <span class="sr-only">活动规则</span>
      </button>

      <span
        class="lottery-shadow"
        :class="{ 'is-animation-hidden': showDrawAnimation }"
        data-testid="lottery-shadow"
        aria-hidden="true"
      ></span>

      <button
        class="lottery-tube"
        :class="{ 'is-animation-hidden': showDrawAnimation }"
        data-testid="lottery-tube"
        type="button"
        aria-label="点击签筒立即摇签"
        :disabled="isDrawTemporarilyDisabled"
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
        :disabled="isDrawTemporarilyDisabled"
        @click="handleDraw('button')"
      >
        <img :src="homeAsset('btn_draw_now.png')" alt="" />
        <span class="sr-only">立即摇签</span>
      </button>

      <p v-if="tipMessage" class="chance-tip" role="alert">{{ tipMessage }}</p>

      <nav class="bottom-nav" aria-label="首页快捷入口">
        <button data-testid="home-rewards-entry" type="button" @click="goRewards">我的奖励</button>
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

  <main v-else-if="currentPage === 'p2'" class="p2-page" aria-label="P2 今日考运签结果页">
    <section class="p2-stage" :style="p2StageStyle">
      <h1 class="sr-only">六月考运签</h1>

      <button class="p2-back-button" data-testid="p2-back" type="button" aria-label="返回" @click="goP2Back">
        <span class="sr-only">返回</span>
      </button>

      <div v-if="p2Status === 'loading'" class="p2-state" role="status">
        <strong>签文加载中</strong>
        <p>正在为你生成今日考运签。</p>
      </div>

      <div v-else-if="p2Status === 'error'" class="p2-state" role="alert">
        <strong>签文加载失败，请稍后再试</strong>
        <button type="button" @click="retryP2Result">重新加载</button>
      </div>

      <template v-else>
        <p class="p2-sign-tag">{{ p2SignTag }}</p>

        <section class="p2-side-text p2-good-for" aria-label="今日宜">
          <span class="sr-only">宜：</span>
          <p
            :aria-label="p2Result.goodFor"
            :title="p2Result.goodFor"
            :class="getP2SideCopyClass(p2Result.goodFor)"
          >
            <span v-for="(char, index) in p2GoodForChars" :key="`good-${index}`">{{ char }}</span>
          </p>
        </section>

        <section class="p2-main-text" aria-label="主签文">
          <p v-for="column in p2MainColumns" :key="column.id" :aria-label="column.text">
            <span v-for="(char, index) in column.chars" :key="`${column.id}-${index}`">{{ char }}</span>
          </p>
        </section>

        <section class="p2-side-text p2-avoid" aria-label="今日忌">
          <span class="sr-only">忌：</span>
          <p
            :aria-label="p2Result.avoid"
            :title="p2Result.avoid"
            :class="getP2SideCopyClass(p2Result.avoid)"
          >
            <span v-for="(char, index) in p2AvoidChars" :key="`avoid-${index}`">{{ char }}</span>
          </p>
        </section>

        <h2 class="sr-only">今日解签</h2>
        <p class="sr-only">点击下方按钮，查看今日解签内容</p>

        <button
          class="p2-ask-button"
          data-testid="ask-xiaopu"
          type="button"
          aria-label="问小璞"
          @click="openP2Explain"
        >
          <img :src="p2Asset('btn_ask_xiaoying.png')" alt="" />
          <span class="sr-only">问小璞</span>
        </button>

        <button
          class="p2-share-poster"
          data-testid="share-poster"
          type="button"
          aria-label="点击分享海报"
          @click="openP2Poster"
        >
          <img :src="p2Asset('btn_share_poster.png')" alt="" />
          <span class="sr-only">点击分享海报</span>
        </button>
      </template>
    </section>

    <div v-if="p2Panel" class="modal-mask" role="presentation">
      <section class="share-dialog p2-dialog" role="dialog" aria-modal="true" aria-labelledby="p2-panel-title">
        <h2 id="p2-panel-title">{{ p2PanelTitle }}</h2>
        <p>{{ p2PanelText }}</p>
        <div class="dialog-actions">
          <button data-testid="close-p2-panel" type="button" @click="closeP2Panel">知道了</button>
        </div>
      </section>
    </div>
  </main>

  <main v-else-if="currentPage === 'p4'" class="p4-page" aria-label="P4 AI 解签结果页">
    <section class="p4-stage" :style="p4StageStyle">
      <h1 class="sr-only">{{ p4Detail.title }}</h1>

      <button class="p4-back-button" data-testid="p4-back" type="button" aria-label="返回" @click="goP4Back">
        <span class="sr-only">返回</span>
      </button>

      <div v-if="p4Status === 'loading'" class="p4-state p4-thinking-state" role="status">
        <div class="p4-loading-mark" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <strong class="p4-loading-title">AI 解签中</strong>
        <ol class="p4-thinking-list" aria-label="AI 解签生成进度">
          <li v-for="line in p4VisibleThinkingLines" :key="line" class="p4-thinking-line">
            <span class="p4-thinking-dot" aria-hidden="true"></span>
            <span class="p4-thinking-text">{{ line }}</span>
          </li>
        </ol>
        <div class="sr-only">
          <strong>解签结果加载中</strong>
          <p>正在为你生成 AI 解签结果。</p>
        </div>
      </div>

      <div v-else-if="p4Status === 'error'" class="p4-state" role="alert">
        <strong>解签结果加载失败，请稍后再试</strong>
        <button type="button" @click="retryP4Detail">重新加载</button>
      </div>

      <template v-else>
        <section class="p4-poem" aria-label="AI 解签文案">
          <p v-for="line in p4Detail.explainLines" :key="line">{{ line }}</p>
        </section>

        <p class="sr-only">{{ p4Detail.themeText }}</p>

        <section class="p4-product" aria-label="牛肉福利推荐">
          <img :src="p4ProductImageSrc" alt="" @error="handleP4ProductImageError" />
          <p>{{ p4Detail.product.productName }}</p>
        </section>

        <button
          v-if="shouldShowP4ClaimButton"
          class="p4-claim-button"
          data-testid="claim-benefit"
          type="button"
          :disabled="p4ClaimButtonDisabled"
          @click="claimP4Benefit"
        >
          <img :src="p4Asset('btn_claim_benefit.png')" alt="" />
          <span v-if="p4ClaimStatus !== 'unclaimed'" class="p4-claim-visible-label" aria-hidden="true">
            {{ p4ClaimButtonText }}
          </span>
          <span class="sr-only">{{ p4ClaimButtonText }}</span>
        </button>

        <p v-if="p4ClaimTipText" class="p4-claim-tip" role="status">{{ p4ClaimTipText }}</p>

        <button
          v-if="p4ClaimStatus === 'claimed'"
          class="p4-rewards-entry"
          data-testid="p4-rewards-entry"
          type="button"
          @click="goRewards"
        >
          我的奖励
        </button>
      </template>

      <div v-if="showP5ClaimSuccess" class="p5-popup-mask" role="presentation">
        <section
          class="p5-popup-panel"
          data-testid="p5-mobile-claim-popup"
          role="dialog"
          aria-modal="true"
          aria-labelledby="p5-popup-title"
        >
          <h2 id="p5-popup-title" class="p5-popup-title">
            {{ isP5Claimed ? p5Result.pageTitle : '领取优惠券' }}
          </h2>

          <button
            class="p5-close-button"
            data-testid="p5-close"
            type="button"
            aria-label="关闭"
            @click="closeP5ClaimSuccess"
          >
            <span class="sr-only">关闭</span>
          </button>

          <section class="p5-coupon-card" :aria-label="p5Result.reward.couponName">
            <img :key="p5CouponImageSrc" :src="p5CouponImageSrc" alt="" />
            <span class="sr-only">
              {{ p5Result.reward.couponLabel }} {{ p5Result.reward.thresholdText }}
              {{ p5Result.reward.amountText }}{{ p5Result.reward.unitText }}
            </span>
          </section>

          <form class="p5-mobile-form" @submit.prevent="handleP5PrimaryAction">
            <span class="p5-mobile-placeholder-cover" aria-hidden="true"></span>
            <label class="p5-mobile-label" for="p5-mobile-input">手机号</label>
            <input
              id="p5-mobile-input"
              v-model.trim="p5Mobile"
              class="p5-mobile-input"
              data-testid="p5-mobile-input"
              type="tel"
              inputmode="numeric"
              autocomplete="tel"
              maxlength="11"
              placeholder="请输入手机号"
              :disabled="p5ClaimStatus === 'submitting' || isP5Claimed"
              @focus="focusP5MobileInput"
            />
            <p v-if="p5MobileError" class="p5-mobile-error" data-testid="p5-mobile-error" role="alert">
              {{ p5MobileError }}
            </p>

            <button
              class="p5-use-button p5-primary-button"
              data-testid="p5-submit-claim"
              type="submit"
              :disabled="p5PrimaryButtonDisabled"
            >
              <span>{{ p5PrimaryButtonText }}</span>
            </button>

            <p v-if="p5UseMessage" class="p5-use-tip" role="status">{{ p5UseMessage }}</p>
          </form>
        </section>
      </div>
    </section>
  </main>

  <main v-else-if="currentPage === 'p6'" class="p6-page" aria-label="P6 我的奖励页">
    <section class="p6-stage" :style="p6StageStyle">
      <h1 class="sr-only">{{ p6Center.page_title }}</h1>

      <button class="p6-back-button" data-testid="p6-back" type="button" aria-label="返回" @click="goP6Back">
        <span class="sr-only">返回</span>
      </button>

      <button
        class="p6-rule-button"
        data-testid="p6-rules"
        type="button"
        aria-label="活动规则"
        @click="openP6Rules"
      >
        <img :src="p6Asset('btn_activity_rules.png')" alt="" />
        <span class="sr-only">{{ p6Center.rules_action.button_text }}</span>
      </button>

      <div v-if="p6Status === 'loading'" class="p6-state" role="status">
        <strong>奖励加载中</strong>
        <p>正在同步你的考运进度和奖励。</p>
      </div>

      <div v-else-if="p6Status === 'error'" class="p6-state" role="alert">
        <strong>我的奖励加载失败，请稍后再试</strong>
        <button type="button" @click="retryP6Center">重新加载</button>
      </div>

      <template v-else>
        <section class="p6-progress-summary" aria-label="我的考运进度">
          <h2 class="sr-only">我的考运进度</h2>
          <p class="p6-share-label">已分享</p>
          <p class="p6-share-count" aria-live="polite">
            <strong>{{ p6ShareCount }}</strong>
            <span class="p6-share-target">/{{ p6ShareTarget }}</span>
            <span class="p6-share-unit">人</span>
          </p>
          <p class="p6-progress-desc">{{ p6Progress.progress_desc }}</p>

          <ol class="p6-day-list" aria-label="点亮进度">
            <li
              v-for="item in p6ProgressDays"
              :key="item.day"
              class="p6-day-node"
              :class="{ 'is-complete': item.complete }"
              :aria-label="`第${item.day}天${item.complete ? '已点亮' : '未点亮'}`"
            >
              <span class="p6-day-number">{{ item.day }}</span>
              <small>第{{ item.day }}天</small>
            </li>
          </ol>
        </section>

        <section class="p6-reward-grid" :class="p6RewardGridClass" aria-label="我的奖励">
          <h2 class="sr-only">我的奖励</h2>
          <article
            v-for="reward in p6RewardCards"
            :key="reward.reward_id"
            class="p6-reward-card"
            :class="{ 'is-gift': isP6GiftReward(reward) }"
            data-testid="p6-reward-card"
          >
            <img
              v-if="resolveP6RewardImage(reward)"
              class="p6-reward-image"
              :src="resolveP6RewardImage(reward)"
              alt=""
            />
            <div v-else class="p6-gift-visual" aria-hidden="true">
              <strong>985+</strong>
              <span>和牛礼盒</span>
            </div>

            <span class="sr-only">{{ reward.title }} {{ reward.unit_text }} {{ reward.desc }}</span>

            <button
              class="p6-reward-action"
              :class="{
                'is-muted': isP6GiftReward(reward) && reward.status === 'not_qualified',
                'is-pending': isP6RewardPending(reward),
              }"
              :data-testid="getP6RewardActionTestId(reward)"
              type="button"
              :disabled="isP6RewardDisabled(reward) || p6ActionStatus === 'redirecting'"
              @click="useP6Reward(reward)"
            >
              {{ getP6RewardButtonText(reward) }}
            </button>
          </article>
        </section>

        <section v-if="p6Product" class="p6-product-card" aria-label="精选好物推荐">
          <h2 class="sr-only">精选好物推荐</h2>
          <img class="p6-product-image" :src="p6ProductImageSrc" alt="" @error="handleP6ProductImageError" />
          <div class="p6-product-copy">
            <h3 class="sr-only">{{ p6Product.title }}</h3>
            <p>{{ p6Product.subtitle }}</p>
            <button
              class="p6-product-action"
              data-testid="p6-product-action"
              type="button"
              :disabled="p6ActionStatus === 'redirecting'"
              @click="openP6Product"
            >
              <img :src="p6Asset('btn_go_see.png')" alt="" />
              <span class="sr-only">{{ p6Product.button_text }}</span>
            </button>
          </div>
        </section>

        <p v-if="p6ActionMessage" class="p6-action-tip" role="status">{{ p6ActionMessage }}</p>

        <button
          class="p6-draw-again"
          data-testid="p6-draw-again"
          type="button"
          :disabled="p6ActionStatus === 'redirecting'"
          @click="drawAgainFromP6"
        >
          <img :src="p6Asset('btn_draw_again.png')" alt="" />
          <span class="sr-only">{{ p6DrawAgainButtonText }}</span>
        </button>
      </template>
    </section>
  </main>

  <main v-else-if="currentPage === 'p8'" class="p8-page" aria-label="P8 大奖资格确认页">
    <section class="p8-stage" :style="p8StageStyle">
      <button class="p8-back-button" data-testid="p8-back" type="button" aria-label="返回" @click="goP8Back">
        <span class="sr-only">返回</span>
      </button>

      <template v-if="p8Qualification.qualified">
        <header class="p8-hero-copy" aria-label="大奖资格标题">
          <h1>
            <span v-for="line in p8HeroLines" :key="line">{{ line }}</span>
          </h1>
          <p>{{ p8Prize.hero.subtitle }}</p>
        </header>

        <section class="p8-qualification-copy" aria-label="大奖资格信息">
          <h2>{{ p8Qualification.qualify_desc }}</h2>
          <p>{{ p8Qualification.prize_title }}</p>
          <ul>
            <li v-for="benefit in p8Prize.benefits" :key="benefit.id">
              {{ benefit.title }} {{ benefit.desc }}
            </li>
          </ul>
        </section>

        <p class="p8-lottery-no" data-testid="p8-lottery-no">{{ p8LotteryNoText }}</p>

        <section class="p8-status-copy" aria-label="开奖状态">
          <p class="p8-status-value">{{ p8LotteryStatus.status_text }}</p>
          <p class="p8-draw-time">{{ p8LotteryStatus.draw_time_desc }}</p>
          <p class="p8-status-lottery-no">{{ p8LotteryNoText }}</p>
          <p class="p8-status-notice">{{ p8LotteryStatus.notice }}</p>
          <strong class="p8-publicity-title">{{ p8LotteryStatus.publicity_title }}</strong>
          <p class="p8-publicity-desc">{{ p8LotteryStatus.publicity_desc }}</p>
        </section>

        <section class="p8-wechat-copy" aria-label="企微二维码">
          <h2>{{ p8WechatGroup.title }}</h2>
          <ul>
            <li v-for="benefit in p8WechatGroup.benefits" :key="benefit">{{ benefit }}</li>
          </ul>
        </section>

        <div class="p8-qrcode-frame" data-testid="p8-qrcode" @click="trackP8QrcodeClick">
          <img v-if="p8QrcodeSrc" :src="p8QrcodeSrc" alt="企微二维码" @error="handleP8QrcodeError" />
          <span v-else>企微二维码暂未配置</span>
        </div>
      </template>

      <section v-else class="p8-not-qualified" data-testid="p8-not-qualified" role="alert">
        <strong>大奖资格暂未解锁</strong>
        <p>{{ p8Qualification.qualify_desc }}</p>
        <button type="button" @click="goP8Back">返回我的奖励</button>
      </section>
    </section>
  </main>

  <main v-else-if="currentPage === 'rules'" class="p7-page" aria-label="P7 活动规则页" @scroll.passive="trackP7ScrollToBottom">
    <section class="p7-stage" :style="p7StageStyle">
      <button class="p7-back-button" data-testid="p7-back" type="button" aria-label="返回" @click="goP7Back">
        <span class="sr-only">返回</span>
      </button>

      <header class="p7-heading">
        <h1>{{ p7Rules.page_title }}</h1>
        <p>{{ p7Rules.subtitle }}</p>
      </header>

      <section class="p7-rules-card" aria-label="活动规则说明">
        <h2 class="sr-only">活动规则说明</h2>
        <ol class="p7-rule-list">
          <li
            v-for="rule in p7Rules.rules"
            :key="rule.rule_no"
            class="p7-rule-item"
            data-testid="p7-rule-item"
          >
            <span class="p7-rule-number">{{ rule.rule_no }}</span>
            <p>{{ rule.content }}</p>
          </li>
        </ol>
      </section>

      <section class="p7-wechat-card" aria-label="扫码添加企微">
        <div class="p7-qrcode-frame" @click="trackP7QrcodeClick">
          <img v-if="p7QrcodeSrc" :src="p7QrcodeSrc" alt="企微二维码" @error="handleP7QrcodeError" />
          <span v-else>二维码暂未配置</span>
        </div>
        <div class="p7-wechat-copy">
          <strong>{{ p7Rules.wechat_group.title }}</strong>
          <p>{{ p7Rules.wechat_group.desc }}</p>
        </div>
      </section>
    </section>
  </main>

  <section v-else class="placeholder-page">
    <h1>P6 我的奖励页占位</h1>
    <p>这里后续接入我的考运进度和奖励信息。</p>
    <button type="button" @click="goHome">返回首页</button>
  </section>

  <div
    v-if="showDrawAnimation"
    class="draw-animation-overlay"
    data-testid="draw-animation-overlay"
    aria-label="抽签动画"
  >
    <section class="draw-animation-shell" role="status" aria-live="polite">
      <video
        class="draw-animation-video"
        data-testid="draw-animation-video"
        autoplay
        muted
        playsinline
        preload="auto"
        @canplay="playDrawAnimation"
        @ended="completeDrawAnimation"
        @error="failDrawAnimation"
      >
        <source
          data-testid="draw-animation-webm-source"
          :src="drawAnimationWebmSrc"
          type="video/webm"
        >
        <source
          data-testid="draw-animation-mp4-source"
          :src="drawAnimationVideoSrc"
          type="video/mp4"
        >
      </video>
      <p v-if="drawAnimationStatus === 'waiting'" class="draw-animation-status">抽签结果生成中</p>
    </section>
  </div>

  <aside
    v-if="showLocalApiDebugPanel"
    class="local-api-debug-panel"
    :class="{ 'is-expanded': debugPanelExpanded }"
    aria-label="本地接口请求信息"
  >
    <button
      class="local-api-debug-toggle"
      data-testid="local-api-debug-toggle"
      type="button"
      :aria-expanded="String(debugPanelExpanded)"
      @click="debugPanelExpanded = !debugPanelExpanded"
    >
      <strong>接口</strong>
      <small>{{ debugPanelSummary }}</small>
    </button>
    <div v-if="debugPanelExpanded" class="local-api-debug-body" data-testid="local-api-debug-body">
      <header>
        <strong>接口请求</strong>
        <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer">Docs</a>
      </header>
      <p v-if="debugApiEntries.length === 0">等待接口请求...</p>
      <ul v-else>
        <li v-for="entry in debugApiEntries" :key="`${entry.logged_at}-${entry.method}-${entry.displayUrl}`">
          <span :class="{ 'is-error': !entry.ok }">{{ entry.method }} {{ entry.status }}</span>
          <code>{{ entry.displayUrl }}</code>
          <small>{{ entry.duration_ms }}ms · {{ entry.logged_at }}</small>
        </li>
      </ul>
    </div>
  </aside>
</template>
