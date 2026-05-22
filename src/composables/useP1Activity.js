import { computed, onBeforeUnmount, ref } from 'vue'
import { activityApi } from '../api/activityApi'

const MAX_DAILY_SHARE_REWARDS = 3
const TIP_VISIBLE_MS = 3000
const PAGE_ROUTES = {
  home: '/activity/home',
  p2: '/activity/result',
  p4: '/activity/explain',
  p6: '/activity/rewards',
  rules: '/activity/rules',
  p8: '/activity/grand-prize',
}
const PREVIEW_PAGE_ALIASES = {
  p1: 'home',
  p7: 'rules',
  '/': 'home',
  '/activity/home': 'home',
  '/activity/result': 'p2',
  '/activity/explain': 'p4',
  '/activity/rewards': 'p6',
  '/activity/rules': 'rules',
  '/activity/grand-prize': 'p8',
}
const PREVIEW_PAGES = new Set(['home', 'p2', 'p4', 'p6', 'p8', 'rules'])
const NO_CHANCE_TIP = '今日机会已用完，分享可再得机会'
const SESSION_USER_KEY_STORAGE = 'gaokao_h5_user_key'
const P4_THINKING_STEP_MS = 620
const P4_THINKING_MIN_VISIBLE_MS = 1700
const P4_THINKING_LINES = [
  '正在读取签面灵感',
  '匹配牛气补给能量',
  '整理专属好运签文',
]
const DEFAULT_P2_RESULT = {
  signType: '金榜题名签',
  signLevel: '上上签',
  mainTextColumns: ['金榜题名', '愿你落笔生花'],
  goodFor: '稳住心态、认真审题、从容落笔',
  avoid: '慌乱失分、粗心失分、临场焦虑',
  explainText: '今日宜沉心静气，按自己的节奏稳扎稳打。先把确定会做的题拿稳，再从容攻克难题。',
}
const DEFAULT_P4_DETAIL = {
  title: 'AI解签结果',
  explainLines: [
    '锦绣前程，步步生花',
    '实力如锦，终成佳绩',
    '心之所向，金榜题名',
  ],
  themeText: '高考好运 × 牛气补给',
  thinkingProcess: P4_THINKING_LINES,
  ai: {
    provider: 'fallback',
    model: '',
    thinkingEnabled: false,
    promptVersion: '',
  },
  product: {
    productId: 'default-beef-card',
    productName: '和牛 · 锦绣前程板腱',
    productImage: 'card_beef_photo.png',
  },
  benefit: {
    benefitId: 'default-benefit',
    claimStatus: 'unclaimed',
    claimButtonText: '领取专属福利',
  },
}
const DEFAULT_P5_RESULT = {
  pageTitle: '领取成功',
  claimStatus: 'input',
  reward: {
    rewardType: 'coupon',
    couponId: 'default-coupon',
    couponLabel: '优惠券',
    thresholdText: '无门槛',
    amountText: '20',
    unitText: '元券',
    couponName: '无门槛20元券',
    couponStatus: 'unused',
    validTimeText: '',
  },
  action: {
    buttonText: '去领取',
    type: 'placeholder',
    target: '',
  },
}
const DEFAULT_P6_CENTER = {
  activity_id: 'gaokao_lucky_sign_2026',
  page_title: '閹存垹娈戞總鏍уС',
  progress: {
    shared_count: 0,
    share_target: 5,
    lit_days: 0,
    light_target: 7,
    completed_days: [],
    gift_qualified: false,
    gift_status: 'not_qualified',
    progress_desc: '閸掑棔闊?娑擃亜銈介崣瀣剁礉閹存牜鐤拋锛勫仯娴?婢垛晪绱濈挧銏犲絿985閸滃瞼澧扮粈鑲╂磪閹惰棄顨涚挧鍕壐閿?',
  },
  claimed_rewards: [
    {
      reward_id: 'coupon_10',
      reward_type: 'coupon',
      title: '10',
      unit_text: '閸?',
      desc: '閺冪娀妫Σ娑樺煖',
      status: 'unused',
      button_text: '閸樿濞囬悽?',
      action: {
        type: 'mini_program_coupon_package',
        target: '/pages/coupon-package/index',
      },
    },
    {
      reward_id: 'coupon_20',
      reward_type: 'coupon',
      title: '20',
      unit_text: '閸?',
      desc: '閺冪娀妫Σ娑樺煖',
      status: 'unused',
      button_text: '閸樿濞囬悽?',
      action: {
        type: 'mini_program_coupon_package',
        target: '/pages/coupon-package/index',
      },
    },
    {
      reward_id: 'coupon_30',
      reward_type: 'coupon',
      title: '30',
      unit_text: '閸?',
      desc: '閺冪娀妫Σ娑樺煖',
      status: 'unused',
      button_text: '閸樿濞囬悽?',
      action: {
        type: 'mini_program_coupon_package',
        target: '/pages/coupon-package/index',
      },
    },
    {
      reward_id: 'discount_9',
      reward_type: 'discount_coupon',
      title: '9閹?',
      desc: '閸忋劌婧€閸欘垳鏁?',
      status: 'unused',
      button_text: '閸樿濞囬悽?',
      action: {
        type: 'mini_program_coupon_package',
        target: '/pages/coupon-package/index',
      },
    },
    {
      reward_id: 'discount_75',
      reward_type: 'discount_coupon',
      title: '7.5閹?',
      desc: '鐟楀灝鍠庨悧娑欏笓娑撴挸鐫?',
      status: 'unused',
      button_text: '閸樿濞囬悽?',
      action: {
        type: 'mini_program_coupon_package',
        target: '/pages/coupon-package/index',
      },
    },
  ],
  gift_reward: {
    reward_id: 'gift_985',
    reward_type: 'gift_lottery_qualification',
    title: '985閸滃瞼澧扮粈鑲╂磪',
    desc: '閹惰棄顨涚挧鍕壐',
    status: 'not_qualified',
    button_text: '閺堫亣鎻弽?',
    action: {
      type: 'gift_qualification_detail',
      target: '',
    },
  },
  product_recommend: {
    product_id: 'sku_001',
    title: '妤傛鈧啯鍨氶崝鐔哄閹?',
    subtitle: '缁箖鈧鑳烘鑼躲偪閸?妞存粌顏︽径姘湲',
    button_text: '閸樿崵婀呴惇?',
    image_url: 'card_beef_photo.png',
    action: {
      type: 'mini_program_product_detail',
      target: '/pages/product/detail?id=sku_001',
    },
  },
  draw_again_action: {
    button_text: '閸愬秵濞婃稉鈧▎?',
    action: {
      type: 'p1_home',
      target: '/activity/home',
    },
  },
  rules_action: {
    button_text: '濞茶濮╃憴鍕灟',
    action: {
      type: 'activity_rules',
      target: '/activity/rules',
    },
  },
}
const DEFAULT_P7_RULES = {
  activity_id: 'gaokao_lucky_sign_2026',
  page_title: '濞茶濮╃憴鍕灟',
  subtitle: '娑撯偓娑撻箖鐝稉?璺?閸忣厽婀€閻楁稒鐨甸崝鐘宠ˉ缁?',
  rules: [
    {
      rule_no: 1,
      content: '濮ｅ繋姹夊В蹇旀）姒涙顓?1 濞嗏剝濞婄粵鐐簚娴兼熬绱?',
    },
    {
      rule_no: 2,
      content: '閸掑棔闊╂總钘夊几閸欏倷绗岄獮璺虹暚閹存劖濞婄粵鎾呯礉閸樼喓鏁ら幋宄邦杻閸?1 濞嗏€冲И閸旀稖绻樻惔锔肩幢',
    },
    {
      rule_no: 3,
      content: '濮ｅ繑妫╅柅姘崇箖閸掑棔闊╅張鈧径姘冲箯瀵?3 濞嗭繝顤傛径鏍ㄦ簚娴兼熬绱?',
    },
    {
      rule_no: 4,
      content: '濮ｅ繑妫╃€瑰本鍨氶幎鐣岊劮閸氬函绱濋懛顏勫З閻愰€涘瘨 1 婢垛晞绻樻惔锔肩幢',
    },
    {
      rule_no: 5,
      content: '缁鳖垵顓搁悙閫涘瘨 7 婢垛晜鍨ㄩ柇鈧拠?5 娴ｅ秴銈介崣瀣剁礉閸欘垵袙闁?985 閸滃瞼澧扮粈鑲╂磪閹惰棄顨涚挧鍕壐閿?',
    },
    {
      rule_no: 6,
      content: '婵傛牕鎼ч弫浼村櫤閺堝妾洪敍灞藉徔娴ｆ挷浜掑ú璇插З妞ょ敻娼伴崗顒傘仛娑撳搫鍣敍?',
    },
    {
      rule_no: 7,
      content: '閺堫剚妞块崝銊よ礋婵炲彉绠版禍鎺戝З娑撳海顨㈢粋蹇旀た閸旑煉绱濇稉宥勫敩鐞涖劋鎹㈡担鏇熷灇缂佲晠顣╁ù瀣ㄢ偓?',
    },
  ],
  wechat_group: {
    qrcode_url: 'qrcode_wechat_group.png',
    title: '閹殿偆鐖滃ǎ璇插娴间礁浜?',
    desc: '鏉╂稓鍏㈤崣顖濆箯閸欐牗妞块崝銊﹀絹闁辨帇鈧椒绗撶仦鐐扮喘閹姴寮风粋蹇撳焺闁氨鐓?',
  },
}
const DEFAULT_P8_PRIZE = {
  activity_id: 'gaokao_lucky_sign_2026',
  hero: {
    title: '鏉╃偟鐢婚幍鎾冲幢7婢垛€恘婢堆冾殯鐠у嫭鐗稿鑼缎掗柨?',
    subtitle: '閻楁稒鐨垫径褍顨涚挧鍕壐瀹歌尙鈥樼拋?',
  },
  qualification: {
    qualified: true,
    qualify_type: 'checkin_7_days',
    qualify_desc: '閹厼鏋╂担鐘插嚒鐎瑰本鍨?婢垛晜澧﹂崡?',
    prize_title: '985閸滃瞼澧扮粈鑲╂磪閹惰棄顨涚挧鍕壐',
    lottery_no: 'KY202406-0038',
  },
  benefits: [
    {
      id: 'coupon_50',
      title: '50閸忓啫鍩?',
      desc: '娴间礁浜曟０鍡楀絿',
    },
    {
      id: 'gift_qualification',
      title: '缁€鑲╂磪鐠у嫭鐗?',
      desc: '瀹歌尪袙闁?',
    },
    {
      id: 'draw_notice',
      title: '瀵偓婵傛牗褰侀柋?',
      desc: '娴间礁浜曢柅姘辩叀',
    },
  ],
  lottery_status: {
    status: 'pending',
    status_text: '瀵板懎绱戞總?',
    draw_time_desc: '濞茶濮╃紒鎾存将閸?娑擃亜浼愭担婊勬）閸愬懐绮烘稉鈧鈧總?',
    notice: '娑擃厼顨涚紓鏍у娇鐏忓棗婀張顒勩€夐棃顫瑢娴间礁浜曠粈鍓у參閸氬本顒為崗顒傘仛',
    publicity_title: '娑擃厼顨涢崗顒傘仛',
    publicity_desc: '瀵偓婵傛牕鎮楃亸鍡楁躬濮濄倖娲块弬?',
  },
  wechat_group: {
    qrcode_url: 'qrcode_grand_prize_wechat.png',
    qrcode_id: 'grand_prize_wechat_default',
    title: '閹殿偆鐖滃ǎ璇插娴间礁浜曟０鍡楀絿',
    benefits: ['领取优惠券', '查看抽奖资格', '接收开奖通知'],
  },
}

Object.assign(DEFAULT_P6_CENTER, {
  page_title: '鎴戠殑濂栧姳',
  progress: {
    shared_count: 0,
    share_target: 5,
    lit_days: 0,
    light_target: 7,
    completed_days: [],
    gift_qualified: false,
    gift_status: 'not_qualified',
    progress_desc: '鍒嗕韩5涓ソ鍙嬶紝鎴栫疮璁＄偣浜?澶╋紝璧㈠彇985鍜岀墰绀肩洅鎶藉璧勬牸锛?',
  },
  claimed_rewards: [
    {
      reward_id: 'coupon_10',
      reward_type: 'coupon',
      title: '10',
      unit_text: '鍏?',
      desc: '鏃犻棬妲涘埜',
      status: 'unused',
      button_text: '鍘讳娇鐢?',
      action: { type: 'mini_program_coupon_package', target: '/pages/coupon-package/index' },
    },
    {
      reward_id: 'coupon_20',
      reward_type: 'coupon',
      title: '20',
      unit_text: '鍏?',
      desc: '鏃犻棬妲涘埜',
      status: 'unused',
      button_text: '鍘讳娇鐢?',
      action: { type: 'mini_program_coupon_package', target: '/pages/coupon-package/index' },
    },
    {
      reward_id: 'coupon_30',
      reward_type: 'coupon',
      title: '30',
      unit_text: '鍏?',
      desc: '鏃犻棬妲涘埜',
      status: 'unused',
      button_text: '鍘讳娇鐢?',
      action: { type: 'mini_program_coupon_package', target: '/pages/coupon-package/index' },
    },
    {
      reward_id: 'discount_9',
      reward_type: 'discount_coupon',
      title: '9鎶?',
      unit_text: '',
      desc: '鍏ㄥ満鍙敤',
      status: 'unused',
      button_text: '鍘讳娇鐢?',
      action: { type: 'mini_program_coupon_package', target: '/pages/coupon-package/index' },
    },
    {
      reward_id: 'discount_75',
      reward_type: 'discount_coupon',
      title: '7.5鎶?',
      unit_text: '',
      desc: '瑗垮喎鐗涙帓涓撳睘',
      status: 'unused',
      button_text: '鍘讳娇鐢?',
      action: { type: 'mini_program_coupon_package', target: '/pages/coupon-package/index' },
    },
  ],
  gift_reward: {
    reward_id: 'gift_985',
    reward_type: 'gift_lottery_qualification',
    title: '985鍜岀墰绀肩洅',
    desc: '鎶藉璧勬牸',
    status: 'not_qualified',
    button_text: '鏈揪鏍?',
    action: { type: 'gift_qualification_detail', target: '/activity/grand-prize' },
  },
  product_recommend: {
    product_id: 'sku_001',
    title: '楂樿€冩垚鍔熺墰鎺?',
    subtitle: '绮鹃€夎胺楗茶タ鍐?椴滃澶氭眮',
    button_text: '鍘荤湅鐪?',
    image_url: 'card_beef_photo.png',
    action: { type: 'mini_program_product_detail', target: '/pages/product/detail?id=sku_001' },
  },
  draw_again_action: {
    button_text: '鍐嶆娊涓€娆?',
    action: { type: 'p1_home', target: '/activity/home' },
  },
  rules_action: {
    button_text: '娲诲姩瑙勫垯',
    action: { type: 'activity_rules', target: '/activity/rules' },
  },
})

Object.assign(DEFAULT_P7_RULES, {
  page_title: '娲诲姩瑙勫垯',
  subtitle: '涓€涓鹃珮涓?路 鍏湀鐗涙皵鍔犳补绛?',
  rules: [
    { rule_no: 1, content: '?????? 1 ??????' },
    { rule_no: 2, content: '????????????' },
    { rule_no: 3, content: '??????????' },
    { rule_no: 4, content: '?????????????' },
    { rule_no: 5, content: '????????????' },
    { rule_no: 6, content: '?????????' },
    { rule_no: 7, content: '?????????' },
  ],
  wechat_group: {
    qrcode_url: 'qrcode_wechat_group.png',
    title: '鎵爜娣诲姞浼佸井',
    desc: '杩涚兢鍙幏鍙栨椿鍔ㄦ彁閱掋€佷笓灞炰紭鎯犲強绂忓埄閫氱煡',
  },
})

Object.assign(DEFAULT_P8_PRIZE, {
  hero: {
    title: '杩炵画鎵撳崱7澶‐n澶у璧勬牸宸茶В閿?',
    subtitle: '鐗涙皵澶у璧勬牸宸茬‘璁?',
  },
  qualification: {
    qualified: true,
    qualify_type: 'checkin_7_days',
    qualify_desc: '鎭枩浣犲凡瀹屾垚7澶╂墦鍗?',
    prize_title: '985鍜岀墰绀肩洅鎶藉璧勬牸',
    lottery_no: 'KY202406-0038',
  },
  benefits: [
    { id: 'coupon_50', title: '50??', desc: '?????' },
    { id: 'gift_qualification', title: '????', desc: '????' },
    { id: 'draw_notice', title: '????', desc: '????' },
  ],
  lottery_status: {
    status: 'pending',
    status_text: '寰呭紑濂?',
    draw_time_desc: '娲诲姩缁撴潫鍚?涓伐浣滄棩鍐呯粺涓€寮€濂?',
    notice: '涓缂栧彿灏嗗湪鏈〉闈笌浼佸井绀剧兢鍚屾鍏ず',
    publicity_title: '涓鍏ず',
    publicity_desc: '寮€濂栧悗灏嗗湪姝ゆ洿鏂?',
  },
  wechat_group: {
    qrcode_url: 'qrcode_grand_prize_wechat.png',
    qrcode_id: 'grand_prize_wechat_default',
    title: '鎵爜娣诲姞浼佸井棰嗗彇',
    benefits: ['棰嗗彇50鍏冨埜', '鎺ユ敹绀肩洅寮€濂栭€氱煡', '鏌ョ湅涓缁撴灉'],
  },
})

const normalizeP2Result = (result = {}) => ({
  ...DEFAULT_P2_RESULT,
  ...result,
  mainTextColumns: result.mainTextColumns?.length
    ? result.mainTextColumns
    : DEFAULT_P2_RESULT.mainTextColumns,
})

const normalizeP4Detail = (detail = {}) => ({
  ...DEFAULT_P4_DETAIL,
  ...detail,
  explainLines: detail.explainLines?.length
    ? detail.explainLines
    : DEFAULT_P4_DETAIL.explainLines,
  thinkingProcess: detail.thinkingProcess?.length
    ? detail.thinkingProcess
    : DEFAULT_P4_DETAIL.thinkingProcess,
  ai: {
    ...DEFAULT_P4_DETAIL.ai,
    ...(detail.ai ?? {}),
  },
  product: {
    ...DEFAULT_P4_DETAIL.product,
    ...(detail.product ?? {}),
  },
  benefit: {
    ...DEFAULT_P4_DETAIL.benefit,
    ...(detail.benefit ?? {}),
  },
})

const normalizeP5Result = (result = {}) => ({
  ...DEFAULT_P5_RESULT,
  ...result,
  reward: {
    ...DEFAULT_P5_RESULT.reward,
    ...(result.reward ?? {}),
  },
  action: {
    ...DEFAULT_P5_RESULT.action,
    ...(result.action ?? {}),
  },
})
const normalizeP5RewardPreview = (benefit = {}, currentReward = {}) => {
  const benefitReward = benefit.reward ?? {}
  const rewardCode = benefitReward.reward_code ?? benefitReward.rewardCode ?? benefitReward.couponId ?? benefit.rewardCode

  return {
    ...currentReward,
    ...benefitReward,
    reward_code: benefitReward.reward_code ?? rewardCode ?? currentReward.reward_code,
    couponId: benefitReward.couponId ?? rewardCode ?? currentReward.couponId,
  }
}

const buildP5InputResultFromBenefit = (benefit = {}) =>
  normalizeP5Result({
    pageTitle: '领取优惠券',
    claimStatus: 'input',
    reward: normalizeP5RewardPreview(benefit, {}),
  })

const P6_FIXED_REWARD_CODES = ['coupon_10', 'coupon_20', 'coupon_30', 'discount_9', 'discount_75']
const P6_FIXED_REWARD_CODE_SET = new Set(P6_FIXED_REWARD_CODES)
const P6_REWARD_CLAIM_TEXT = '\u53bb\u9886\u53d6'
const P6_REWARD_UNCLAIMED_TEXT = '\u672a\u9886\u53d6'
const P6_GIFT_USE_TEXT = '\u53bb\u4f7f\u7528'
const MOBILE_PATTERN = /^1[3-9]\d{9}$/

const normalizeP6Reward = (reward = {}) => ({
  reward_code: reward.reward_code ?? reward.reward_id ?? '',
  reward_id: reward.reward_id ?? reward.reward_code ?? '',
  reward_type: reward.reward_type ?? reward.rewardType ?? 'coupon',
  title: reward.title ?? '',
  unit_text: reward.unit_text ?? '',
  desc: reward.desc ?? '',
  status: reward.status ?? 'unused',
  button_text: reward.button_text ?? P6_REWARD_CLAIM_TEXT,
  image_url: reward.image_url ?? '',
  action: {
    type: reward.action?.type ?? 'mini_program_coupon_package',
    target: reward.action?.target ?? '',
  },
})
const isP6GiftDisplayReward = (reward) => reward?.reward_type === 'gift_lottery_qualification'
const getP6RewardCode = (reward) => reward?.reward_code || reward?.reward_id || ''
const isP6FixedReward = (reward) => P6_FIXED_REWARD_CODE_SET.has(getP6RewardCode(reward))
const mergeP6RewardSlot = (base = {}, reward = {}) => ({
  ...base,
  ...reward,
  action: {
    ...(base.action ?? {}),
    ...(reward.action ?? {}),
  },
})
const resolveP6SlotButtonText = (status) => (status === 'unused' ? P6_REWARD_CLAIM_TEXT : P6_REWARD_UNCLAIMED_TEXT)
const buildFixedP6DisplayRewards = (suppliedRewards, claimedRewards) => {
  const slotByCode = new Map()

  DEFAULT_P6_CENTER.claimed_rewards
    .map(normalizeP6Reward)
    .filter(isP6FixedReward)
    .forEach((reward) => {
      const code = getP6RewardCode(reward)
      slotByCode.set(code, {
        ...reward,
        reward_code: code,
        reward_id: code,
        status: 'unclaimed',
        button_text: P6_REWARD_UNCLAIMED_TEXT,
      })
    })

  suppliedRewards
    .filter((reward) => !isP6GiftDisplayReward(reward) && isP6FixedReward(reward))
    .forEach((reward) => {
      const code = getP6RewardCode(reward)
      const status = reward.status === 'unused' ? 'unused' : 'unclaimed'
      slotByCode.set(code, {
        ...mergeP6RewardSlot(slotByCode.get(code), reward),
        reward_code: code,
        reward_id: code,
        status,
        button_text: resolveP6SlotButtonText(status),
      })
    })

  const claimedByCode = new Map()
  claimedRewards
    .filter(isP6FixedReward)
    .forEach((reward) => {
      const code = getP6RewardCode(reward)
      if (!claimedByCode.has(code)) {
        claimedByCode.set(code, reward)
      }
    })

  return P6_FIXED_REWARD_CODES.map((code) => {
    const template = slotByCode.get(code) ?? normalizeP6Reward({ reward_code: code, reward_id: code, status: 'unclaimed' })
    const claimed = claimedByCode.get(code)
    const status = claimed ? 'unused' : template.status === 'unused' ? 'unused' : 'unclaimed'
    const reward = claimed
      ? {
          ...mergeP6RewardSlot(template, claimed),
          image_url: template.image_url || claimed.image_url,
        }
      : template

    return {
      ...reward,
      reward_code: code,
      reward_id: code,
      status,
      button_text: resolveP6SlotButtonText(status),
    }
  })
}

const normalizeP6Center = (center = {}) => {
  const progress = {
    ...DEFAULT_P6_CENTER.progress,
    ...(center.progress ?? {}),
  }
  const lightTarget = Number(progress.light_target) || DEFAULT_P6_CENTER.progress.light_target
  const completedDays = Array.isArray(progress.completed_days) ? progress.completed_days : []
  const claimedRewards = (center.claimed_rewards ?? [])
    .map(normalizeP6Reward)
    .filter((reward) => reward.status !== 'unclaimed')
  const giftReward = {
    ...DEFAULT_P6_CENTER.gift_reward,
    ...(center.gift_reward ?? {}),
    action: {
      ...DEFAULT_P6_CENTER.gift_reward.action,
      ...(center.gift_reward?.action ?? {}),
    },
  }
  const suppliedDisplayRewards = Array.isArray(center.display_rewards) && center.display_rewards.length > 0
    ? center.display_rewards.map(normalizeP6Reward)
    : []
  const displayGift = suppliedDisplayRewards.find(isP6GiftDisplayReward) ?? giftReward
  const displayRewards = [...buildFixedP6DisplayRewards(suppliedDisplayRewards, claimedRewards), displayGift]

  return {
    ...DEFAULT_P6_CENTER,
    ...center,
    progress: {
      ...progress,
      shared_count: Number(progress.shared_count) || 0,
      share_target: Number(progress.share_target) || DEFAULT_P6_CENTER.progress.share_target,
      lit_days: Number(progress.lit_days) || completedDays.length,
      light_target: lightTarget,
      completed_days: completedDays
        .map((day) => Number(day))
        .filter((day) => Number.isInteger(day) && day >= 1 && day <= lightTarget),
      gift_qualified: Boolean(progress.gift_qualified),
    },
    claimed_rewards: claimedRewards,
    gift_reward: giftReward,
    display_rewards: displayRewards,
    product_recommend: center.product_recommend
      ? {
          ...DEFAULT_P6_CENTER.product_recommend,
          ...center.product_recommend,
          action: {
            ...DEFAULT_P6_CENTER.product_recommend.action,
            ...(center.product_recommend.action ?? {}),
          },
        }
      : DEFAULT_P6_CENTER.product_recommend,
    draw_again_action: {
      ...DEFAULT_P6_CENTER.draw_again_action,
      ...(center.draw_again_action ?? {}),
      action: {
        ...DEFAULT_P6_CENTER.draw_again_action.action,
        ...(center.draw_again_action?.action ?? {}),
      },
    },
    rules_action: {
      ...DEFAULT_P6_CENTER.rules_action,
      ...(center.rules_action ?? {}),
      action: {
        ...DEFAULT_P6_CENTER.rules_action.action,
        ...(center.rules_action?.action ?? {}),
      },
    },
  }
}

const normalizeP7Rules = (rules = {}) => ({
  ...DEFAULT_P7_RULES,
  ...rules,
  rules: (rules.rules?.length ? rules.rules : DEFAULT_P7_RULES.rules).map((rule, index) => ({
    rule_no: Number(rule.rule_no) || index + 1,
    content: rule.content ?? '',
  })),
  wechat_group: {
    ...DEFAULT_P7_RULES.wechat_group,
    ...(rules.wechat_group ?? {}),
  },
})

const normalizeP8Prize = (prize = {}) => {
  const qualification = {
    ...DEFAULT_P8_PRIZE.qualification,
    ...(prize.qualification ?? {}),
  }
  const lotteryStatus = {
    ...DEFAULT_P8_PRIZE.lottery_status,
    ...(prize.lottery_status ?? {}),
  }
  const wechatGroup = {
    ...DEFAULT_P8_PRIZE.wechat_group,
    ...(prize.wechat_group ?? {}),
  }

  return {
    ...DEFAULT_P8_PRIZE,
    ...prize,
    hero: {
      ...DEFAULT_P8_PRIZE.hero,
      ...(prize.hero ?? {}),
    },
    qualification: {
      ...qualification,
      qualified: qualification.qualified !== false,
      lottery_no: qualification.lottery_no ?? '',
    },
    benefits: (prize.benefits?.length ? prize.benefits : DEFAULT_P8_PRIZE.benefits).map((benefit, index) => ({
      id: benefit.id ?? `benefit_${index + 1}`,
      title: benefit.title ?? '',
      desc: benefit.desc ?? '',
    })),
    lottery_status: {
      ...lotteryStatus,
      status: lotteryStatus.status ?? 'pending',
      status_text: lotteryStatus.status_text || DEFAULT_P8_PRIZE.lottery_status.status_text,
      draw_time_desc: lotteryStatus.draw_time_desc || DEFAULT_P8_PRIZE.lottery_status.draw_time_desc,
      notice: lotteryStatus.notice || DEFAULT_P8_PRIZE.lottery_status.notice,
      publicity_title: lotteryStatus.publicity_title || DEFAULT_P8_PRIZE.lottery_status.publicity_title,
      publicity_desc: lotteryStatus.publicity_desc || DEFAULT_P8_PRIZE.lottery_status.publicity_desc,
    },
    wechat_group: {
      ...wechatGroup,
      benefits: wechatGroup.benefits?.length ? wechatGroup.benefits : DEFAULT_P8_PRIZE.wechat_group.benefits,
    },
  }
}

const resolvePreviewPage = (page) => {
  const normalized = PREVIEW_PAGE_ALIASES[page] ?? page

  return PREVIEW_PAGES.has(normalized) ? normalized : 'home'
}

const buildCanonicalSearch = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  const params = new URLSearchParams(window.location.search)
  params.delete('page')
  const value = params.toString()

  return value ? `?${value}` : ''
}

const syncBrowserRoute = (page, { replace = false, preserveSearch = false } = {}) => {
  if (typeof window === 'undefined') {
    return
  }

  const targetPath = PAGE_ROUTES[page] ?? PAGE_ROUTES.home
  const targetSearch = preserveSearch ? buildCanonicalSearch() : ''
  const target = `${targetPath}${targetSearch}`
  const current = `${window.location.pathname}${window.location.search}`

  if (current === target) {
    return
  }

  window.history[replace ? 'replaceState' : 'pushState']({}, '', target)
}

const isTestMode = () => import.meta.env.MODE === 'test'

const createUserKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `h5_${crypto.randomUUID()}`
  }

  return `h5_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const getLocalUserKey = () => {
  if (typeof window === 'undefined') {
    return createUserKey()
  }

  const stored = window.localStorage.getItem(SESSION_USER_KEY_STORAGE)
  if (stored) {
    return stored
  }

  const created = createUserKey()
  window.localStorage.setItem(SESSION_USER_KEY_STORAGE, created)
  return created
}

export function useP1Activity(options = {}) {
  const apiClient = options.apiClient ?? activityApi
  const backendEnabled = Boolean(options.apiClient) || !isTestMode()
  const initialPage = resolvePreviewPage(options.initialPage)
  const sessionToken = ref(options.initialSessionToken ?? '')
  const userKey = ref(options.userKey ?? getLocalUserKey())
  const latestDrawId = ref(options.initialDrawId ?? null)
  const sessionPromise = ref(null)
  const drawChance = ref(options.initialChance ?? 1)
  const shareRewardCount = ref(options.initialShareRewardCount ?? 0)
  const currentPage = ref(initialPage)
  const p2Panel = ref('')
  const p2Result = ref(normalizeP2Result(options.initialP2Result))
  const p2Status = ref(options.initialP2Status ?? 'success')
  const p4Detail = ref(normalizeP4Detail(options.initialP4Detail))
  const p4Status = ref(options.initialP4Status ?? 'success')
  const p4ThinkingLines = ref(P4_THINKING_LINES)
  const p4ThinkingStepCount = ref(p4Status.value === 'loading' ? 1 : P4_THINKING_LINES.length)
  const p4VisibleThinkingLines = computed(() => p4ThinkingLines.value.slice(0, p4ThinkingStepCount.value))
  const p4ClaimStatus = ref(p4Detail.value.benefit.claimStatus)
  const p4ClaimMessage = ref('')
  const p5Result = ref(normalizeP5Result(options.initialP5Result))
  const p5ClaimStatus = ref('input')
  const p5Mobile = ref('')
  const p5MobileError = ref('')
  const p5UseStatus = ref('idle')
  const p5UseMessage = ref('')
  const showP5ClaimSuccess = ref(false)
  const p6Center = ref(normalizeP6Center(options.initialP6Center))
  const p6Status = ref(options.initialP6Status ?? 'success')
  const p7Rules = ref(normalizeP7Rules(options.initialP7Rules))
  const p8Prize = ref(normalizeP8Prize(options.initialP8Prize))
  const rulesReturnPage = ref('home')
  const p8ReturnPage = ref('p6')
  const p6ActionStatus = ref('idle')
  const p6ActionMessage = ref('')
  const showShareGuide = ref(false)
  const tipMessage = ref('')
  const isDrawTemporarilyDisabled = ref(false)
  const showDrawAnimation = ref(false)
  const drawAnimationStatus = ref('idle')

  const getCurrentBenefitRewardCode = () => {
    const benefit = p4Detail.value.benefit ?? {}
    const benefitReward = benefit.reward ?? {}
    const p5Reward = p5Result.value.reward ?? {}
    const normalizeRewardCode = (rewardCode) =>
      rewardCode && rewardCode !== DEFAULT_P5_RESULT.reward.couponId ? rewardCode : null

    return (
      normalizeRewardCode(p5Reward.reward_code) ||
      normalizeRewardCode(p5Reward.rewardCode) ||
      normalizeRewardCode(p5Reward.couponId) ||
      normalizeRewardCode(benefitReward.reward_code) ||
      normalizeRewardCode(benefitReward.rewardCode) ||
      normalizeRewardCode(benefitReward.couponId) ||
      normalizeRewardCode(benefit.rewardCode) ||
      null
    )
  }
  const getVisibleP5RewardCode = () => {
    const reward = p5Result.value.reward ?? {}

    return (
      reward.reward_code ||
      reward.rewardCode ||
      reward.couponId ||
      p4Detail.value.benefit?.rewardCode ||
      null
    )
  }
  const drawRequestStatus = ref('idle')
  const drawRequestMessage = ref('')
  const drawAnimationFinished = ref(false)
  let tipTimer = null
  let p4ClaimMessageTimer = null
  let p4ThinkingTimer = null
  let p4ThinkingStartedAt = 0
  let p4ExplainRequestId = 0
  const clearTipTimer = () => {
    if (tipTimer) {
      clearTimeout(tipTimer)
      tipTimer = null
    }
  }
  const clearP4ClaimMessageTimer = () => {
    if (p4ClaimMessageTimer) {
      clearTimeout(p4ClaimMessageTimer)
      p4ClaimMessageTimer = null
    }
  }
  const clearP4ThinkingTimer = () => {
    if (p4ThinkingTimer) {
      clearTimeout(p4ThinkingTimer)
      p4ThinkingTimer = null
    }
  }
  const scheduleNextP4ThinkingLine = () => {
    clearP4ThinkingTimer()
    if (p4Status.value !== 'loading' || p4ThinkingStepCount.value >= p4ThinkingLines.value.length) {
      return
    }

    p4ThinkingTimer = setTimeout(() => {
      p4ThinkingStepCount.value += 1
      p4ThinkingTimer = null
      scheduleNextP4ThinkingLine()
    }, P4_THINKING_STEP_MS)
  }
  const startP4Thinking = () => {
    p4ThinkingLines.value = P4_THINKING_LINES
    p4ThinkingStepCount.value = 1
    p4ThinkingStartedAt = Date.now()
    scheduleNextP4ThinkingLine()
  }
  const stopP4Thinking = () => {
    clearP4ThinkingTimer()
    p4ThinkingStepCount.value = p4ThinkingLines.value.length
  }
  const waitForP4ThinkingMinimum = () => {
    const elapsed = Date.now() - p4ThinkingStartedAt
    const remaining = Math.max(0, P4_THINKING_MIN_VISIBLE_MS - elapsed)
    return remaining ? new Promise((resolve) => setTimeout(resolve, remaining)) : Promise.resolve()
  }
  const clearTip = () => {
    clearTipTimer()
    tipMessage.value = ''
    isDrawTemporarilyDisabled.value = false
  }
  const clearP4ClaimMessage = () => {
    clearP4ClaimMessageTimer()
    p4ClaimMessage.value = ''
  }
  const showTimedTip = (message) => {
    clearTipTimer()
    tipMessage.value = message
    isDrawTemporarilyDisabled.value = true
    tipTimer = setTimeout(() => {
      tipMessage.value = ''
      isDrawTemporarilyDisabled.value = false
      tipTimer = null
    }, TIP_VISIBLE_MS)
  }
  const resetDrawAnimation = () => {
    showDrawAnimation.value = false
    drawAnimationStatus.value = 'idle'
    drawRequestStatus.value = 'idle'
    drawRequestMessage.value = ''
    drawAnimationFinished.value = false
    isDrawTemporarilyDisabled.value = false
  }
  const startDrawAnimation = () => {
    clearTip()
    showDrawAnimation.value = true
    drawAnimationStatus.value = 'playing'
    drawRequestStatus.value = 'loading'
    drawRequestMessage.value = ''
    drawAnimationFinished.value = false
    isDrawTemporarilyDisabled.value = true
    trackEvent('draw_animation_start')
  }
  const finishDrawAnimationIfReady = () => {
    if (!showDrawAnimation.value || !drawAnimationFinished.value) {
      return
    }

    if (drawRequestStatus.value === 'loading') {
      drawAnimationStatus.value = 'waiting'
      return
    }

    const status = drawRequestStatus.value
    const message = drawRequestMessage.value
    showDrawAnimation.value = false
    drawAnimationStatus.value = 'idle'
    drawRequestStatus.value = 'idle'
    drawRequestMessage.value = ''
    drawAnimationFinished.value = false
    isDrawTemporarilyDisabled.value = false

    if (status === 'ready') {
      setCurrentPage('p2')
      trackEvent('draw_animation_end', { draw_id: latestDrawId.value })
      trackEvent('result_page_view', { draw_id: latestDrawId.value })
      trackEvent('result_page_render_success', { draw_id: latestDrawId.value })
      return
    }

    if (status === 'no_chance') {
      showTimedTip(message || NO_CHANCE_TIP)
      trackEvent('draw_no_chance_view')
      return
    }

    if (status === 'error') {
      setCurrentPage('p2')
      trackEvent('draw_animation_end', { status: 'error' })
      trackEvent('result_page_load_error')
    }
  }
  const resolveDrawRequest = (status, message = '') => {
    drawRequestStatus.value = status
    drawRequestMessage.value = message
    finishDrawAnimationIfReady()
  }
  const completeDrawAnimation = () => {
    drawAnimationFinished.value = true
    finishDrawAnimationIfReady()
  }
  const failDrawAnimation = () => {
    trackEvent('draw_animation_load_fail')
    drawAnimationFinished.value = true
    finishDrawAnimationIfReady()
  }
  const showTimedP4ClaimMessage = (message = '福利已领取，可到我的奖励查看') => {
    clearP4ClaimMessageTimer()
    p4ClaimMessage.value = message
    p4ClaimMessageTimer = setTimeout(() => {
      p4ClaimMessage.value = ''
      p4ClaimMessageTimer = null
    }, TIP_VISIBLE_MS)
  }
  const rulesScrollToBottomTracked = ref(false)
  const setCurrentPage = (page, routeOptions) => {
    currentPage.value = page
    syncBrowserRoute(page, routeOptions)
  }

  syncBrowserRoute(currentPage.value, { replace: true, preserveSearch: true })

  if (p4ClaimStatus.value === 'claimed') {
    showTimedP4ClaimMessage(p4Detail.value.benefit.claimMessage || '福利已领取，可到我的奖励查看')
  }

  const applyDailyState = (dailyState = {}) => {
    if (Number.isFinite(Number(dailyState.remaining_draw_count))) {
      drawChance.value = Number(dailyState.remaining_draw_count)
    }
    if (Number.isFinite(Number(dailyState.share_reward_count_today))) {
      shareRewardCount.value = Number(dailyState.share_reward_count_today)
    }
  }

  const applyProgress = (progress = {}) => {
    if (!progress || Object.keys(progress).length === 0) {
      return
    }

    p6Center.value = normalizeP6Center({
      ...p6Center.value,
      progress: {
        ...p6Center.value.progress,
        ...progress,
      },
      gift_reward: {
        ...p6Center.value.gift_reward,
        status: progress.gift_qualified ? 'qualified' : p6Center.value.gift_reward.status,
        button_text: progress.gift_qualified ? P6_GIFT_USE_TEXT : p6Center.value.gift_reward.button_text,
      },
    })
  }

  const applySessionPayload = (payload = {}) => {
    if (payload.session_token) {
      sessionToken.value = payload.session_token
    }
    applyDailyState(payload.daily_state)
    applyProgress(payload.progress)
  }

  const ensureSession = async () => {
    if (!backendEnabled) {
      return ''
    }

    if (sessionToken.value) {
      return sessionToken.value
    }

    if (!sessionPromise.value) {
      sessionPromise.value = apiClient
        .createSession({
          user_key: userKey.value,
          source_page: options.initialPage ?? 'p1',
          source_channel: 'h5',
          share_token: options.shareToken,
        })
        .then((payload) => {
          applySessionPayload(payload)
          if (currentPage.value === 'home') {
            trackEvent('activity_home_view', {
              draw_chance: drawChance.value,
              share_count_today: shareRewardCount.value,
            })
          }
          return sessionToken.value
        })
        .finally(() => {
          sessionPromise.value = null
        })
    }

    return sessionPromise.value
  }

  const shareProgressText = computed(
    () => `今日分享奖励 ${shareRewardCount.value}/${MAX_DAILY_SHARE_REWARDS}`,
  )

  const trackEvent = (eventName, eventPayload = {}) => {
    if (!backendEnabled || !eventName) {
      return
    }

    apiClient.trackEvent?.({
      session_token: sessionToken.value || undefined,
      page_code: currentPage.value,
      event_name: eventName,
      event_payload: eventPayload,
      client_time: new Date().toISOString(),
    }).catch(() => {})
  }

  const goHome = () => {
    resetDrawAnimation()
    setCurrentPage('home')
    p2Panel.value = ''
    clearP4ClaimMessage()
    p5UseMessage.value = ''
    p6ActionMessage.value = ''
    showP5ClaimSuccess.value = false
    clearTip()
  }

  onBeforeUnmount(() => {
    clearTipTimer()
    clearP4ClaimMessageTimer()
    clearP4ThinkingTimer()
  })

  const loadRules = async () => {
    if (!backendEnabled || !apiClient.getRulesDetail) {
      return
    }

    try {
      p7Rules.value = normalizeP7Rules(await apiClient.getRulesDetail())
      trackEvent('rules_page_render_success')
      if (p7Rules.value.wechat_group?.qrcode_url) {
        trackEvent('rules_qrcode_exposure')
      }
    } catch {
      trackEvent('rules_page_render_fail')
      trackEvent('rules_page_load_fail')
    }
  }

  const goRules = () => {
    trackEvent('rule_click')
    rulesReturnPage.value = currentPage.value === 'rules' ? rulesReturnPage.value : currentPage.value
    setCurrentPage('rules')
    loadRules()
    trackEvent('rules_page_view')
  }

  const goRewards = async () => {
    trackEvent('my_reward_click')
    trackEvent('reward_center_page_view')
    setCurrentPage('p6')
    p6ActionMessage.value = ''
    if (backendEnabled) {
      p6Status.value = 'loading'
      try {
        const token = await ensureSession()
        p6Center.value = normalizeP6Center(await apiClient.getRewardCenter({ session_token: token }))
        p6Status.value = 'success'
      } catch {
        p6Status.value = 'error'
      }
    }
    trackEvent(p6Status.value === 'error' ? 'reward_center_load_fail' : 'reward_center_render_success')
    trackEvent('progress_module_exposure')
    trackEvent('reward_card_exposure')
    trackEvent('product_recommend_exposure')
  }

  const handleDraw = async (source = 'button') => {
    if (isDrawTemporarilyDisabled.value || showDrawAnimation.value) {
      return
    }

    trackEvent(source === 'tube' ? 'draw_tube_click' : 'draw_entry_click')

    if (backendEnabled) {
      if (drawChance.value <= 0) {
        showTimedTip(NO_CHANCE_TIP)
        trackEvent('draw_no_chance_view')
        return
      }

      p2Status.value = 'loading'
      p2Panel.value = ''
      startDrawAnimation()
      try {
        const token = await ensureSession()
        const payload = await apiClient.executeDraw({ session_token: token, source })
        if (!payload.success) {
          p2Status.value = 'success'
          applyDailyState(payload.daily_state)
          resolveDrawRequest('no_chance', payload.message || NO_CHANCE_TIP)
          return
        }

        latestDrawId.value = payload.draw_id
        p2Result.value = normalizeP2Result(payload.result)
        applyDailyState(payload.daily_state)
        applyProgress(payload.progress)
        p2Status.value = 'success'
        trackEvent('draw_success', { draw_id: payload.draw_id })
        resolveDrawRequest('ready')
      } catch {
        p2Status.value = 'error'
        trackEvent('draw_fail')
        resolveDrawRequest('error')
      }
      return
    }

    if (drawChance.value > 0) {
      p2Panel.value = ''
      p2Status.value = 'success'
      startDrawAnimation()
      resolveDrawRequest('ready')
      return
    }

    showTimedTip(NO_CHANCE_TIP)
    trackEvent('draw_no_chance_view')
  }

  const openShareGuide = () => {
    trackEvent('share_get_chance_click')
    showShareGuide.value = true
  }

  const closeShareGuide = () => {
    showShareGuide.value = false
  }

  const openP2Explain = async () => {
    trackEvent('ask_xiaopu_click')
    setCurrentPage('p4')
    p2Panel.value = ''
    clearP4ClaimMessage()
    p5UseMessage.value = ''
    p6ActionMessage.value = ''
    showP5ClaimSuccess.value = false

    if (backendEnabled) {
      const requestId = p4ExplainRequestId + 1
      p4ExplainRequestId = requestId
      p4Status.value = 'loading'
      startP4Thinking()
      try {
        const token = await ensureSession()
        const [detail] = await Promise.all([
          apiClient.getExplainDetail({ session_token: token, draw_id: latestDrawId.value }),
          waitForP4ThinkingMinimum(),
        ])
        if (requestId !== p4ExplainRequestId || p4Status.value !== 'loading') {
          return
        }
        if (detail.draw_id || detail.drawId) {
          latestDrawId.value = detail.draw_id ?? detail.drawId
        }
        p4Detail.value = normalizeP4Detail(detail)
        p4ThinkingLines.value = p4Detail.value.thinkingProcess
        stopP4Thinking()
        p4ClaimStatus.value = p4Detail.value.benefit.claimStatus
        if (p4ClaimStatus.value === 'claimed') {
          showTimedP4ClaimMessage(p4Detail.value.benefit.claimMessage || '福利已领取，可到我的奖励查看')
        }
        p4Status.value = 'success'
        trackEvent('explain_load_success', { draw_id: latestDrawId.value })
        trackEvent('ai_explain_page_view', { draw_id: latestDrawId.value })
        trackEvent('ai_explain_render_success', { draw_id: latestDrawId.value })
        trackEvent('ai_explain_product_exposure', {
          draw_id: latestDrawId.value,
          product_id: p4Detail.value.product.productId,
        })
      } catch {
        await waitForP4ThinkingMinimum()
        if (requestId !== p4ExplainRequestId || p4Status.value !== 'loading') {
          return
        }
        stopP4Thinking()
        p4Status.value = 'error'
        trackEvent('explain_load_fail', { draw_id: latestDrawId.value })
        trackEvent('ai_explain_load_fail', { draw_id: latestDrawId.value })
      }
    }
  }

  const goP2Back = () => {
    trackEvent('p2_back_click')
    goHome()
  }

  const goP4Back = () => {
    trackEvent('p4_back_click')
    p4ExplainRequestId += 1
    clearP4ThinkingTimer()
    setCurrentPage('p2')
    clearP4ClaimMessage()
    p5UseMessage.value = ''
    showP5ClaimSuccess.value = false
  }

  const openP2Poster = () => {
    // Replace with POST /api/poster/generate when poster generation is available.
    trackEvent('share_poster_click')
    p2Panel.value = 'poster'
  }

  const closeP2Panel = () => {
    p2Panel.value = ''
  }

  const retryP2Result = async () => {
    if (backendEnabled && latestDrawId.value && apiClient.getDrawResultDetail) {
      p2Status.value = 'loading'
      try {
        const token = await ensureSession()
        const detail = await apiClient.getDrawResultDetail({ session_token: token, draw_id: latestDrawId.value })
        p2Result.value = normalizeP2Result(detail.result ?? detail)
        p2Status.value = 'success'
        trackEvent('result_page_render_success', { draw_id: latestDrawId.value })
      } catch {
        p2Status.value = 'error'
        trackEvent('result_page_load_error', { draw_id: latestDrawId.value })
      }
      return
    }

    p2Status.value = 'success'
    trackEvent('result_page_retry_click')
  }

  const retryP4Detail = async () => {
    if (backendEnabled) {
      await openP2Explain()
      return
    }

    p4Status.value = 'success'
    clearP4ClaimMessage()
    p5UseMessage.value = ''
    showP5ClaimSuccess.value = false
    trackEvent('ai_explain_retry_click')
  }

  const retryP6Center = async () => {
    if (backendEnabled) {
      await goRewards()
      return
    }

    p6Status.value = 'success'
    p6ActionMessage.value = ''
    trackEvent('reward_center_render_success')
  }

  const claimP4Benefit = async () => {
    if (p4Status.value !== 'success' || p4ClaimStatus.value === 'claiming') {
      return
    }

    if (p4ClaimStatus.value === 'claimed') {
      showTimedP4ClaimMessage('福利已领取，可到我的奖励查看')
      return
    }

    trackEvent('exclusive_benefit_click')
    let popupBenefit = p4Detail.value.benefit
    if (p4ClaimStatus.value === 'claimed') {
      showTimedP4ClaimMessage(p4Detail.value.benefit.claimMessage || '福利已领取，可到我的奖励查看')
      return
    }

    p5ClaimStatus.value = 'input'
    p5Result.value = buildP5InputResultFromBenefit(popupBenefit)
    p5MobileError.value = ''
    p5UseMessage.value = ''
    showP5ClaimSuccess.value = true
    trackEvent('benefit_mobile_popup_view', {
      draw_id: latestDrawId.value,
      reward_code: getVisibleP5RewardCode(),
    })
    return

    if (backendEnabled) {
      p4ClaimStatus.value = 'claiming'
      clearP4ClaimMessageTimer()
      p4ClaimMessage.value = '福利领取中，请稍候'
      try {
        const token = await ensureSession()
        const result = await apiClient.claimBenefit({
          session_token: token,
          draw_id: latestDrawId.value,
          reward_code: p4Detail.value.benefit.rewardCode,
        })
        p5Result.value = normalizeP5Result(result)
        p4ClaimStatus.value = 'claimed'
        clearP4ClaimMessage()
        showP5ClaimSuccess.value = true
        p5UseMessage.value = ''
        trackEvent('exclusive_benefit_claim_success')
        trackEvent('benefit_claim_success_page_view')
        trackEvent('benefit_claim_result_render_success')
        trackEvent('coupon_card_exposure', {
          coupon_id: p5Result.value.reward.couponId,
        })
      } catch {
        p4ClaimStatus.value = 'unclaimed'
        clearP4ClaimMessageTimer()
        p4ClaimMessage.value = '福利领取失败，请稍后重试'
        trackEvent('exclusive_benefit_claim_fail')
        trackEvent('benefit_claim_result_load_fail')
      }
      return
    }

    p4ClaimStatus.value = 'claimed'
    clearP4ClaimMessage()
    showP5ClaimSuccess.value = true
    p5UseMessage.value = ''
    trackEvent('exclusive_benefit_claim_success')
    trackEvent('benefit_claim_success_page_view')
    trackEvent('benefit_claim_result_render_success')
    trackEvent('coupon_card_exposure', {
      coupon_id: p5Result.value.reward.couponId,
    })
  }

  const focusP5MobileInput = () => {
    trackEvent('benefit_mobile_input_focus', {
      draw_id: latestDrawId.value,
      reward_code: p4Detail.value.benefit.rewardCode,
    })
  }

  const validateP5Mobile = () => {
    const mobile = String(p5Mobile.value || '').trim()
    if (!mobile) {
      p5MobileError.value = '请输入手机号'
      trackEvent('benefit_mobile_validate_fail', { error_code: 'mobile_required', has_mobile: false })
      return ''
    }

    if (!MOBILE_PATTERN.test(mobile)) {
      p5MobileError.value = '请输入正确手机号'
      trackEvent('benefit_mobile_validate_fail', { error_code: 'mobile_invalid', has_mobile: true })
      return ''
    }

    p5MobileError.value = ''
    return mobile
  }

  const markP5ClaimSuccess = (result, mobile) => {
    p5Result.value = normalizeP5Result(result)
    p4ClaimStatus.value = 'claimed'
    p5ClaimStatus.value = 'claimed'
    clearP4ClaimMessage()
    showP5ClaimSuccess.value = true
    const maskedMobile = p5Result.value.receiver_mobile_masked || p5Result.value.receiverMobileMasked || `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
    p5UseMessage.value = `领取成功，已绑定 ${maskedMobile}`
    trackEvent('exclusive_benefit_claim_success')
    trackEvent('benefit_claim_result_render_success')
    trackEvent('coupon_card_exposure', {
      coupon_id: p5Result.value.reward.couponId,
    })
  }

  const redirectP5ClaimAfterMobileBind = () => {
    trackEvent('use_benefit_click', {
      trigger: 'auto_after_mobile_bind',
      claim_no: p5Result.value.claim_no ?? p5Result.value.claimNo,
      action_type: p5Result.value.action?.type,
    })

    p5UseStatus.value = 'redirecting'
    const redirected = runConfiguredAction(
      p5Result.value.action,
      p5UseMessage,
      '\u624b\u673a\u53f7\u5df2\u4fdd\u5b58\uff0c\u9886\u5238\u5165\u53e3\u6682\u672a\u5f00\u653e\uff0c\u8bf7\u7a0d\u540e\u5230\u6211\u7684\u5956\u52b1\u67e5\u770b\u3002',
    )
    p5UseStatus.value = 'idle'

    if (redirected) {
      const actionTarget = p5Result.value.action?.target
      const redirectMessage =
        actionTarget && !String(p5UseMessage.value || '').includes(actionTarget)
          ? `\u624b\u673a\u53f7\u5df2\u4fdd\u5b58\uff0c\u6b63\u5728\u524d\u5f80\u5c0f\u7a0b\u5e8f\u9886\u5238\u4e2d\u5fc3\uff1a${actionTarget}`
          : p5UseMessage.value || '\u624b\u673a\u53f7\u5df2\u4fdd\u5b58\uff0c\u6b63\u5728\u524d\u5f80\u5c0f\u7a0b\u5e8f\u9886\u5238\u4e2d\u5fc3\u3002'

      showP5ClaimSuccess.value = false
      p5MobileError.value = ''
      p5UseMessage.value = ''
      showTimedP4ClaimMessage(redirectMessage)
      trackEvent('use_benefit_redirect_success', {
        trigger: 'auto_after_mobile_bind',
        action_type: p5Result.value.action?.type,
      })
      return
    }

    p5UseMessage.value = '\u624b\u673a\u53f7\u5df2\u4fdd\u5b58\uff0c\u9886\u5238\u5165\u53e3\u6682\u672a\u5f00\u653e\uff0c\u8bf7\u7a0d\u540e\u5230\u6211\u7684\u5956\u52b1\u67e5\u770b\u3002'
    trackEvent('use_benefit_redirect_fail', {
      trigger: 'auto_after_mobile_bind',
      action_type: p5Result.value.action?.type,
    })
  }

  const submitP5MobileClaim = async () => {
    if (p5ClaimStatus.value === 'submitting') {
      return
    }

    if (p5Result.value.claimStatus === 'claimed') {
      useP5Benefit()
      return
    }

    trackEvent('benefit_mobile_submit_click', {
      draw_id: latestDrawId.value,
      reward_code: p4Detail.value.benefit.rewardCode,
      has_mobile: Boolean(p5Mobile.value),
    })

    const mobile = validateP5Mobile()
    if (!mobile) {
      p5ClaimStatus.value = 'invalid'
      return
    }

    if (backendEnabled) {
      p5ClaimStatus.value = 'submitting'
      p4ClaimStatus.value = 'claiming'
      p5UseMessage.value = ''
      try {
        const token = await ensureSession()
        const result = await apiClient.claimBenefit({
          session_token: token,
          draw_id: latestDrawId.value,
          reward_code: getVisibleP5RewardCode(),
          mobile,
          claim_channel: 'h5',
        })
        markP5ClaimSuccess(result, mobile)
        redirectP5ClaimAfterMobileBind()
      } catch {
        p4ClaimStatus.value = 'unclaimed'
        p5ClaimStatus.value = 'input'
        p5UseMessage.value = '领取失败，请稍后重试'
        trackEvent('exclusive_benefit_claim_fail')
        trackEvent('benefit_claim_result_load_fail')
      }
      return
    }

    markP5ClaimSuccess(
      {
        ...p5Result.value,
        pageTitle: '领取成功',
        claimStatus: 'claimed',
        receiver_mobile_masked: `${mobile.slice(0, 3)}****${mobile.slice(-4)}`,
        action: {
          ...p5Result.value.action,
          buttonText: '去领取',
        },
      },
      mobile,
    )
  }

  const closeP5ClaimSuccess = () => {
    trackEvent('benefit_mobile_popup_close', {
      has_input: Boolean(p5Mobile.value),
      claim_status: p5Result.value.claimStatus,
    })
    showP5ClaimSuccess.value = false
    clearP4ClaimMessage()
    p5UseMessage.value = ''
    p5MobileError.value = ''
  }

  const runConfiguredAction = (action, messageRef, fallbackMessage) => {
    if (!action?.target) {
      messageRef.value = fallbackMessage
      return false
    }

    const isMiniProgramAction = String(action.type ?? '').startsWith('mini_program')
    const miniProgramBridge = typeof window !== 'undefined' ? window.wx?.miniProgram : undefined
    if (isMiniProgramAction && typeof miniProgramBridge?.navigateTo === 'function') {
      miniProgramBridge.navigateTo({ url: action.target })
      messageRef.value = ''
      return true
    }

    if (isMiniProgramAction) {
      messageRef.value = `\u6d4b\u8bd5\u73af\u5883\u672a\u68c0\u6d4b\u5230\u5c0f\u7a0b\u5e8f\u6865\uff0c\u76ee\u6807\uff1a${action.target}`
      return true
    }

    if (typeof window !== 'undefined') {
      window.location.href = action.target
      return true
    }

    messageRef.value = `\u6d4b\u8bd5\u73af\u5883\u672a\u68c0\u6d4b\u5230\u5c0f\u7a0b\u5e8f\u6865\uff0c\u76ee\u6807\uff1a${action.target}`
    return true
  }

  const useP5Benefit = () => {
    if (p5UseStatus.value === 'redirecting' || p5Result.value.reward.couponStatus !== 'unused') {
      return
    }

    trackEvent('use_benefit_click')

    if (backendEnabled && runConfiguredAction(p5Result.value.action, p5UseMessage, '使用入口暂未开放，请稍后再试。')) {
      trackEvent('use_benefit_redirect_success')
      return
    }

    p5UseMessage.value = '\u624b\u673a\u53f7\u5df2\u4fdd\u5b58\uff0c\u9886\u5238\u5165\u53e3\u6682\u672a\u5f00\u653e\uff0c\u8bf7\u7a0d\u540e\u5230\u6211\u7684\u5956\u52b1\u67e5\u770b\u3002'
    trackEvent('use_benefit_redirect_fail')
  }

  const goP6Back = () => {
    trackEvent('reward_center_back_click')
    goHome()
  }

  const openP6Rules = () => {
    trackEvent('activity_rules_click')
    rulesReturnPage.value = 'p6'
    setCurrentPage('rules')
    p6ActionMessage.value = ''
    loadRules()
    trackEvent('rules_page_view')
  }

  const goP7Back = () => {
    trackEvent('rules_back_click')
    setCurrentPage(rulesReturnPage.value && rulesReturnPage.value !== 'rules' ? rulesReturnPage.value : 'home')
  }

  const openP8Prize = async () => {
    trackEvent('grand_prize_page_view')
    p8ReturnPage.value = 'p6'
    setCurrentPage('p8')
    p6ActionMessage.value = ''

    if (backendEnabled) {
      try {
        const token = await ensureSession()
        p8Prize.value = normalizeP8Prize(await apiClient.getGrandPrizeDetail({ session_token: token }))
      } catch {
        trackEvent('grand_prize_load_fail')
        trackEvent('grand_prize_render_fail')
        return
      }
    }

    if (p8Prize.value.qualification.qualified) {
      trackEvent('grand_prize_render_success')
      trackEvent('grand_prize_status_exposure')
      trackEvent('grand_prize_qrcode_exposure')
      return
    }

    trackEvent('grand_prize_not_qualified_view')
  }

  const trackP7ScrollToBottom = (event) => {
    if (rulesScrollToBottomTracked.value) {
      return
    }

    const target = event?.target
    const reachedBottom =
      !target || target.scrollHeight <= target.clientHeight || target.scrollTop + target.clientHeight >= target.scrollHeight - 4
    if (reachedBottom) {
      rulesScrollToBottomTracked.value = true
      trackEvent('rules_scroll_to_bottom')
    }
  }

  const trackP7QrcodeClick = () => {
    trackEvent('rules_qrcode_click')
  }

  const trackP7QrcodeLoadFail = () => {
    trackEvent('rules_qrcode_load_fail')
  }

  const trackP8QrcodeClick = () => {
    trackEvent('grand_prize_qrcode_click')
  }

  const trackP8QrcodeLoadFail = () => {
    trackEvent('grand_prize_qrcode_load_fail')
  }

  const goP8Back = () => {
    trackEvent('grand_prize_back_click')
    setCurrentPage(p8ReturnPage.value || 'p6')
  }

  const drawAgainFromP6 = () => {
    trackEvent('draw_again_click')
    goHome()
  }

  const useP6Reward = (reward) => {
    if (p6ActionStatus.value === 'redirecting' || !reward) {
      return
    }

    const isGift = reward.reward_type === 'gift_lottery_qualification'
    const isGiftAvailable = isGift && ['qualified', 'unused'].includes(reward.status)
    const isCouponAvailable = !isGift && reward.status === 'unused'

    if (isGift && !isGiftAvailable) {
      trackEvent('reward_not_qualified_click')
      p6ActionMessage.value = '鏆傛湭杈炬爣锛氬垎浜?涓ソ鍙嬶紝鎴栫疮璁＄偣浜?澶╁悗鍙娇鐢?85鍜岀墰绀肩洅鎶藉璧勬牸銆?'
      return
    }

    if (!isCouponAvailable && !isGiftAvailable) {
      p6ActionMessage.value = '璇ュ鍔卞綋鍓嶄笉鍙娇鐢ㄣ€?'
      return
    }

    trackEvent('reward_use_click')
    if (isGift) {
      openP8Prize()
      return
    }

    if (backendEnabled && runConfiguredAction(reward.action, p6ActionMessage, '券包入口暂未开放，请稍后再试。')) {
      trackEvent('reward_use_redirect_success')
      return
    }

    p6ActionMessage.value = '鍒稿寘鍏ュ彛鏆傛湭寮€鏀撅紝鍚庣画鎸?action.type 鎵挎帴鐪熷疄璺宠浆銆?'
    trackEvent('reward_use_redirect_fail')
  }

  const openP6Product = () => {
    if (p6ActionStatus.value === 'redirecting') {
      return
    }

    trackEvent('product_recommend_click')
    if (
      backendEnabled &&
      runConfiguredAction(p6Center.value.product_recommend?.action, p6ActionMessage, '鍟嗗搧璇︽儏鍏ュ彛鏆傛湭寮€鏀撅紝璇风◢鍚庡啀璇曘€?')
    ) {
      trackEvent('product_recommend_redirect_success')
      return
    }

    p6ActionMessage.value = '鍟嗗搧璇︽儏鍏ュ彛鏆傛湭寮€鏀撅紝鍚庣画鎸?action.type 鎵挎帴鐪熷疄璺宠浆銆?'
    trackEvent('product_recommend_redirect_fail')
  }

  const completeShare = async () => {
    if (backendEnabled) {
      try {
        const token = await ensureSession()
        const result = await apiClient.recordShare({ session_token: token, share_channel: 'wechat' })
        applyDailyState(result.daily_state)
        trackEvent(result.reward_granted ? 'share_chance_add_success' : 'share_chance_limit_reached', {
          share_token: result.share_token,
        })
      } catch {
        trackEvent('share_chance_add_fail')
      }
      return
    }

    if (shareRewardCount.value < MAX_DAILY_SHARE_REWARDS) {
      shareRewardCount.value += 1
      drawChance.value += 1
      trackEvent('share_chance_add_success')
    }
  }

  if (backendEnabled) {
    ensureSession()
      .then(() => {
        if (initialPage === 'p6') {
          return goRewards()
        }
        if (initialPage === 'rules') {
          trackEvent('rules_page_view')
          return loadRules()
        }
        if (initialPage === 'p8') {
          return openP8Prize()
        }
        if (initialPage === 'p4') {
          return openP2Explain()
        }
        return undefined
      })
      .catch(() => {
        trackEvent('activity_home_load_error')
        showTimedTip('濞茶濮╅幒銉ュ經鏉╃偞甯存径杈Е閿涘矁顕涵顔款吇閸氬海顏張宥呭瀹告彃鎯庨崝?')
      })
  }

  return {
    closeP5ClaimSuccess,
    closeShareGuide,
    completeDrawAnimation,
    completeShare,
    currentPage,
    drawChance,
    goHome,
    goP2Back,
    goP4Back,
    goRewards,
    goRules,
    failDrawAnimation,
    handleDraw,
    closeP2Panel,
    openP2Explain,
    openP2Poster,
    openShareGuide,
    p2Panel,
    p2Result,
    p2Status,
    p4ClaimMessage,
    p4ClaimStatus,
    p4Detail,
    p4ThinkingLines,
    p4VisibleThinkingLines,
    p4Status,
    p5Result,
    p5ClaimStatus,
    p5Mobile,
    p5MobileError,
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
    isDrawTemporarilyDisabled,
    goP6Back,
    openP6Product,
    openP6Rules,
    goP7Back,
    retryP4Detail,
    retryP6Center,
    retryP2Result,
    shareProgressText,
    shareRewardCount,
    showDrawAnimation,
    drawAnimationStatus,
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
  }
}
