# P1 首页前端接口检查

## 1. 当前涉及的页面 / 组件文件路径

| 类型 | 路径 | 说明 |
| --- | --- | --- |
| 应用入口 | `src/main.js` | 挂载 Vue 应用。 |
| P1 页面与占位页 | `src/App.vue` | 当前 P1 首页、P2 占位页、活动规则占位页、P6 奖励占位页都在此文件内通过条件渲染实现。 |
| P1 交互逻辑 | `src/composables/useP1Activity.js` | 管理当前页面状态、摇签次数、分享次数、弹窗状态、按钮点击逻辑。 |
| P1 样式 | `src/style.css` | 首页布局、签筒分层、按钮、底部导航、弹窗与占位页样式。 |
| 首页背景图 | `public/assets/home/bg_rank_success.png` | 1242 × 2208 首页背景，已包含标题区域。 |
| 签筒图 | `public/assets/home/element_lottery_box.png` | 独立可点击 / 可动画签筒元素。 |
| 立即摇签按钮图 | `public/assets/home/btn_draw_now.png` | 主 CTA 图片，文案为“立即摇签”。 |
| 活动规则按钮图 | `public/assets/home/tag_activity_rules.png` | 右侧活动规则入口图片。 |
| 测试文件 | `src/App.test.js` | 覆盖 P1 入口、mock 逻辑、资产命名、布局与签筒视觉约束。 |

## 2. P1 当前页面路由

当前项目没有接入 `vue-router`，浏览器 URL 不会随页面切换变化，仍停留在 `/`。

当前通过 `currentPage` 本地状态模拟页面路由：

| currentPage | 页面含义 | 当前实现 |
| --- | --- | --- |
| `home` | P1 首页 | 已实现视觉和基础交互。 |
| `p2` | P2 摇签页 | 占位页。 |
| `rules` | 活动规则页 | 占位页。 |
| `rewards` | P6 我的奖励页 | 占位页。 |

## 3. 每个按钮 / 点击区域的动作

| 点击区域 | DOM / 方法 | 当前动作 | 备注 |
| --- | --- | --- | --- |
| 立即摇签 | `.draw-button` → `handleDraw('button')` | 触发摇签入口；如果 `drawChance > 0`，切换到 `currentPage = 'p2'`；否则显示提示。 | 当前未消耗次数，只做进入 P2 的前置判断。 |
| 签筒 | `.lottery-tube` → `handleDraw('tube')` | 与“立即摇签”同入口；如果 `drawChance > 0`，切换到 P2 占位页；否则显示提示。 | 签筒是独立按钮层，后续可接摇动动画。 |
| 活动规则 | `.rule-entry` → `goRules()` | 调用 `trackEvent('rule_click')`，切换到 `currentPage = 'rules'`。 | 当前是活动规则占位页。 |
| 我的奖励 | 底部导航按钮 → `goRewards()` | 调用 `trackEvent('my_reward_click')`，切换到 `currentPage = 'rewards'`。 | 当前是 P6 占位页。 |
| 分享获取次数 | `[data-testid="share-entry"]` → `openShareGuide()` | 调用 `trackEvent('share_get_chance_click')`，打开分享引导弹窗。 | 当前为前端模拟弹窗。 |

分享弹窗内还有两个临时动作：

| 点击区域 | 方法 | 当前动作 |
| --- | --- | --- |
| 模拟完成分享 | `completeShare()` | 如果 `shareRewardCount < 3`，则 `shareRewardCount += 1`，`drawChance += 1`，并触发 `trackEvent('share_chance_add_success')`。 |
| 知道了 | `closeShareGuide()` | 关闭分享弹窗。 |

## 4. 当前使用的 mock 数据字段

| 字段 / 常量 | 来源 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `initialChance` | `App.vue` props | `1` | 首页初始摇签机会。 |
| `initialShareRewardCount` | `App.vue` props | `0` | 今日初始分享奖励次数。 |
| `drawChance` | `useP1Activity` 本地 `ref` | `initialChance ?? 1` | 当前摇签机会数量。 |
| `shareRewardCount` | `useP1Activity` 本地 `ref` | `initialShareRewardCount ?? 0` | 今日分享奖励次数。 |
| `currentPage` | `useP1Activity` 本地 `ref` | `home` | 模拟当前页面。 |
| `showShareGuide` | `useP1Activity` 本地 `ref` | `false` | 分享弹窗显示状态。 |
| `tipMessage` | `useP1Activity` 本地 `ref` | 空字符串 | 无机会时提示文案。 |
| `shareProgressText` | `computed` | `今日分享奖励 x/3` | 分享奖励进度文案。 |
| `MAX_DAILY_SHARE_REWARDS` | `useP1Activity.js` 常量 | `3` | 每日分享最多增加 3 次摇签机会。 |
| `NO_CHANCE_TIP` | `useP1Activity.js` 常量 | `今日机会已用完，分享可再得机会` | 无摇签机会时的提示。 |

## 5. 后续需要对接的后端接口

当前代码没有真实请求，以下接口为后续对接点。

| 接口 | 触发时机 | 当前替代逻辑 | 建议返回 / 处理重点 |
| --- | --- | --- | --- |
| `GET /api/activity/state` | P1 首页初始化 | 目前由 `initialChance`、`initialShareRewardCount` mock。 | 返回剩余摇签机会、今日分享奖励次数、活动状态、奖励状态、是否已抽签等首页状态。 |
| `POST /api/draw/chance/check` | 点击“立即摇签”或签筒 | 目前只判断本地 `drawChance > 0`。 | 校验当前用户是否有摇签机会；成功后进入 P2；失败时返回无机会 / 活动异常等原因。 |
| `POST /api/share/chance/add` | 原生分享完成后 | 目前点击“模拟完成分享”直接本地加次数。 | 分享完成后增加机会；每日最多增加 3 次，超过后允许分享但不增加机会。 |
| `POST /api/tracking/event` | 页面点击 / 分享成功等事件 | 当前 `trackEvent()` 为空函数。 | 上报 `draw_entry_click`、`draw_tube_click`、`rule_click`、`my_reward_click`、`share_get_chance_click`、`share_chance_add_success` 等事件。 |

## 6. 当前占位内容

| 占位项 | 当前位置 | 当前表现 | 后续动作 |
| --- | --- | --- | --- |
| P2 摇签页 | `App.vue` 中 `currentPage === 'p2'` 分支 | 展示“P2 摇签动画页占位”。 | 接入摇签动画、真实抽签流程、抽签结果。 |
| P6 我的奖励页 | `App.vue` 中 `else` 分支 | 展示“P6 我的奖励页占位”。 | 接入我的考运进度、奖励信息、资格状态。 |
| 活动规则页 | `App.vue` 中 `currentPage === 'rules'` 分支 | 展示“活动规则页占位”。 | 接入活动规则独立页面或真实路由。 |
| 分享引导弹窗 | `App.vue` 中 `showShareGuide` 分支 | 展示前端模拟弹窗和“模拟完成分享”按钮。 | 接入真实分享面板、分享海报或端能力回调。 |

## 7. 当前写死的数据或文案

当前仍有写死数据 / 文案，分为确认固定项和后续应替换项。

确认固定项：

| 内容 | 位置 | 说明 |
| --- | --- | --- |
| `立即摇签` | `App.vue` | 主按钮文案按需求固定。 |
| `我的摇签机会 ${drawChance}次` | `App.vue` | 底部机会展示格式固定，数字来自本地状态。 |
| 首页资产文件名 | `App.vue` / `style.css` | `bg_rank_success.png`、`element_lottery_box.png`、`btn_draw_now.png`、`tag_activity_rules.png`。 |

后续应替换 / 接口化：

| 内容 | 当前值 | 后续建议 |
| --- | --- | --- |
| 初始摇签机会 | `initialChance = 1` | 接 `GET /api/activity/state`。 |
| 今日分享奖励次数 | `initialShareRewardCount = 0` | 接 `GET /api/activity/state`。 |
| 分享奖励上限 | `MAX_DAILY_SHARE_REWARDS = 3` | 如后端可配置，改由接口返回。 |
| 无机会提示 | `今日机会已用完，分享可再得机会` | 可保留前端兜底，优先使用后端错误文案。 |
| 分享弹窗文案 | `分享完成后可获得 1 次摇签机会，每日最多奖励 3 次。` | 后续按真实分享规则或配置返回。 |
| 分享完成动作 | `模拟完成分享` | 后续替换为原生分享回调或分享海报流程。 |
| 占位页文案 | P2 / P6 / 活动规则占位文案 | 后续真实页面开发后删除。 |
| 埋点事件名 | 本地字符串 | 后续需与埋点平台事件表最终确认。 |

## 检查结论

当前 P1 首页前端视觉和基础交互链路已完成，但还没有真实后端接口、真实路由、真实分享能力、P2 / P6 / 活动规则完整页面。

未发现会阻塞当前 P1 首页展示的问题；发现的待办均属于预期占位或 mock：页面路由为本地状态模拟、分享为弹窗模拟、摇签机会为本地 mock、埋点函数为空实现。
