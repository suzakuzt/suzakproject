# P6 H5 前端 Agent 任务卡 v1.1

你是本项目的 **H5 前端开发 Agent**。

## 当前任务

只实现 **P6 我的奖励页 / 考运进度页 / 奖励中心页**。

本页用于展示用户分享进度、摇签打卡 / 点亮进度、已领取奖励、985 礼盒资格、精选好物推荐，并提供返回首页再抽一次入口。

---

## 重要限制

1. 只处理 P6，不要开发 P1、P2、P4、P5、活动规则页或其他页面完整业务。
2. 不要新增未确认的分享按钮、企微二维码、领取成功弹窗、AI 解签正文、分享海报弹窗。
3. 「已分享 X/5 人」必须动态渲染。
4. 1-7 天点亮进度必须动态渲染。
5. 用户完成摇签后由后端记录打卡 / 点亮；每天最多点亮 1 天，P6 只读取展示，不在前端自行累加。
6. 未领取的优惠券 / 折扣券需要展示在 P6，按钮显示「未领取」且不可使用。
7. 985 礼盒资格卡必须始终展示在奖励列表最后一个。
8. 我的奖励最多展示 6 张；已领取券 + 985 卡总数 ≤ 3 时只显示 1 排，4-6 时显示 2 排。
9. 985 礼盒未达标展示「未达标」；分享 5 人或点亮 7 天任一达标后展示「去使用」。
10. 券类奖励点击「去领取」跳小程序券包页。
11. 精选好物「去看看」跳具体商品详情页。
12. 「再抽一次」跳 P1 活动首页，正式/测试目标为 `/activity/home`。
13. 右上角「活动规则」跳 P7 活动规则独立页，正式路由为 `/activity/rules`。
14. 左上角返回按钮当前按返回上一页，无历史栈回 P1 处理。

---

## 页面结构

按 P6 主设计稿还原：

1. 深红活动背景；
2. 左上角返回按钮；
3. 右上角「活动规则」按钮；
4. 顶部标语「坚持打卡赢好礼 考运加持一举高中」；
5. 米金主卡；
6. 「我的考运进度」模块；
7. 分享人数展示；
8. 1-7 天点亮进度条；
9. 「我的奖励」模块；
10. 已领取奖励卡列表；
11. 固定最后一张 985 礼盒资格卡；
12. 「精选好物推荐」商品推荐卡；
13. 底部「再抽一次」按钮。

---

## 数据结构建议

```ts
type Progress = {
  shared_count: number
  share_target: number
  lit_days: number
  light_target: number
  completed_days: number[]
  gift_qualified: boolean
  gift_status: 'not_qualified' | 'qualified' | string
  progress_desc: string
}

type ClaimedReward = {
  reward_id: string
  reward_type: 'coupon' | 'discount_coupon' | string
  title: string
  unit_text?: string
  desc: string
  status: 'unused' | 'used' | 'expired' | 'pending' | string
  button_text: string
  image_url?: string
  action?: {
    type: 'mini_program_coupon_package' | string
    target?: string
  }
}

type GiftReward = {
  reward_id: 'gift_985' | string
  reward_type: 'gift_lottery_qualification' | string
  title: string
  desc: string
  status: 'not_qualified' | 'qualified' | 'unused' | string
  button_text: '未达标' | '去使用' | string
  image_url?: string
  action?: {
    type: 'gift_qualification_detail' | 'mini_program_coupon_package' | string
    target?: string
  }
}

type ProductRecommend = {
  product_id: string
  title: string
  subtitle: string
  button_text: '去看看' | string
  image_url: string
  action: {
    type: 'mini_program_product_detail' | string
    target: string
  }
}
```

---

## 实现要求

### 1. 考运进度

1. 渲染「已分享 X/5 人」，X 和 5 都来自接口；
2. 渲染 1-7 天进度，不能写死图片；
3. `completed_days` 内的天数在原有圆点基础上展示红色点亮态，不额外叠加勾选按钮；
4. 未点亮天数展示米金未完成态；
5. 数据缺失时用 0 分享、0 点亮兜底；
6. 不在 P6 里新增打卡按钮或手动累加点亮天数。

### 2. 我的奖励

1. 渲染 `display_rewards` 作为 P6 实际展示列表；
2. 未领取券展示「未领取」且不可使用；
3. `gift_reward` 始终追加在列表最后一个；
4. 当前展示卡片总数 ≤ 3 时渲染一排；4-6 时渲染两排；
5. 券类奖励可用时按钮展示「去领取」，点击跳小程序券包页；
6. 券类奖励已使用 / 已失效 / 处理中时不能按可用券处理；
7. 985 礼盒未达标时展示「未达标」，不可使用；
8. 985 礼盒达标后展示「去使用」。

### 3. 精选好物推荐

1. 商品图、标题、卖点、按钮均从接口或 mock 读取；
2. 点击「去看看」跳具体商品详情页；
3. 商品为空时隐藏模块或使用后端兜底，不留空白。

### 4. 顶部与底部按钮

1. 左上角返回：history back；无历史栈回 P1；
2. 右上角活动规则：跳活动规则页；
3. 底部再抽一次：跳 P1 活动首页，正式/测试目标为 `/activity/home`；
4. 所有点击需要防重复点击。

### 5. 页面状态

必须支持：

- 页面加载中；
- 页面加载失败；
- 分享 / 点亮数据缺失兜底；
- 无已领取券；
- 985 未达标；
- 券包跳转失败；
- 商品详情跳转失败；
- 活动规则跳转失败；
- 返回无历史栈；
- 重复点击防抖。

---

## 埋点要求

必须触发：

- `reward_center_page_view`
- `reward_center_render_success`
- `reward_center_load_fail`
- `progress_module_exposure`
- `reward_card_exposure`
- `reward_use_click`
- `reward_not_qualified_click`
- `reward_use_redirect_success`
- `reward_use_redirect_fail`
- `product_recommend_exposure`
- `product_recommend_click`
- `product_recommend_redirect_fail`
- `draw_again_click`
- `activity_rules_click`
- `reward_center_back_click`

---

## 交付结果

完成后请说明：

1. 修改了哪些文件；
2. 新增了哪些文件；
3. P6 页面如何访问；
4. 如何模拟分享 0/5、1/5、5/5；
5. 如何模拟点亮 0 天、3 天、7 天；
6. 如何模拟已领取 0、2、5 张券；
7. 如何验证奖励区 1 排 / 2 排逻辑；
8. 如何验证 985 未达标 / 达标状态；
9. 如何验证券包页、商品详情页、P1 首页、活动规则页跳转；
10. `lint / build / test` 执行结果。
