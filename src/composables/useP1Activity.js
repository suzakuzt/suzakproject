import { computed, ref } from 'vue'

const MAX_DAILY_SHARE_REWARDS = 3
const NO_CHANCE_TIP = '今日机会已用完，分享可再得机会'

export function useP1Activity(options = {}) {
  const drawChance = ref(options.initialChance ?? 1)
  const shareRewardCount = ref(options.initialShareRewardCount ?? 0)
  const currentPage = ref('home')
  const showShareGuide = ref(false)
  const tipMessage = ref('')

  const shareProgressText = computed(
    () => `今日分享奖励 ${shareRewardCount.value}/${MAX_DAILY_SHARE_REWARDS}`,
  )

  const trackEvent = () => {
    // Replace with POST /api/tracking/event when backend tracking is available.
  }

  const goHome = () => {
    currentPage.value = 'home'
    tipMessage.value = ''
  }

  const goRules = () => {
    trackEvent('rule_click')
    currentPage.value = 'rules'
  }

  const goRewards = () => {
    trackEvent('my_reward_click')
    currentPage.value = 'rewards'
  }

  const handleDraw = (source = 'button') => {
    trackEvent(source === 'tube' ? 'draw_tube_click' : 'draw_entry_click')

    // Replace this branch with POST /api/draw/chance/check before entering P2.
    if (drawChance.value > 0) {
      currentPage.value = 'p2'
      tipMessage.value = ''
      return
    }

    tipMessage.value = NO_CHANCE_TIP
  }

  const openShareGuide = () => {
    trackEvent('share_get_chance_click')
    showShareGuide.value = true
  }

  const closeShareGuide = () => {
    showShareGuide.value = false
  }

  const completeShare = () => {
    // Replace with POST /api/share/chance/add after native share completes.
    if (shareRewardCount.value < MAX_DAILY_SHARE_REWARDS) {
      shareRewardCount.value += 1
      drawChance.value += 1
      trackEvent('share_chance_add_success')
    }
  }

  return {
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
    shareRewardCount,
    showShareGuide,
    tipMessage,
  }
}
