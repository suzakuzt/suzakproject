# H5 前端总检查文档

> 更新时间：2026-05-21  
> 检查范围：当前 Vue H5 页面框架、页面文档、跳转状态、后端接口和最新业务规则。P5 已更新并实现为「手机号领券弹窗」。

## 1. 当前项目框架

| 类型 | 路径 | 当前状态 |
| --- | --- | --- |
| 应用入口 | `src/main.js` | 挂载 Vue 应用 |
| 页面结构 | `src/App.vue` | P1、P2、P4、P6、P7、P8 在同一文件中按 `currentPage` 渲染；P5 当前是 P4 内浮层 |
| 业务状态 | `src/composables/useP1Activity.js` | 管理抽签、分享、页面切换、接口调用和埋点 |
| 接口封装 | `src/api/activityApi.js` | 统一走同域 `/api` |
| 样式 | `src/style.css` | 页面样式集中维护 |
| 测试 | `src/App.test.js` | 覆盖页面展示和关键交互 |
| 文档 | `docs/` | P1、P2、P4、P5、P6、P7、P8 均有文档和任务卡 |

当前项目尚未接入 `vue-router`，但浏览器 URL 已同步为 `/activity/...` 业务路径；旧 `?page=p*` 只保留早期截图兼容。

## 2. 页面和文档覆盖

| 业务页面 | 代码内部名 | 访问路径 | 文档路径 | 最新定位 |
| --- | --- | --- | --- | --- |
| P1 活动首页 | `home` | `/activity/home` | `docs/home/` | 入口页、抽签机会、分享入口 |
| P2 抽签结果 | `p2` | `/activity/result` | `docs/p2/` | 今日考运签结果 |
| P3 | 无 | 无 | 无 | 当前不实现 |
| P4 AI 解签 | `p4` | `/activity/explain` | `docs/p4/` | AI 解签结果和福利入口 |
| P5 手机号领券弹窗 | P4 内弹窗 | 无独立路由 | `docs/p5/` | 输入手机号后提交领券 |
| P6 我的奖励 | `p6` | `/activity/rewards` | `docs/p6/` | 展示 5 张普通奖励 + 985 礼盒 |
| P7 活动规则 | `rules` | `/activity/rules` | `docs/p7/` | 活动规则和企微二维码 |
| P8 985 资格 | `p8` | `/activity/grand-prize` | `docs/p8/` | 大奖资格、编号、开奖状态 |

## 3. 跳转和按钮状态

| 入口 / 按钮 | 当前目标 | 是否真实路由 | 接口关系 |
| --- | --- | --- | --- |
| P1 立即摇签 | `/activity/result` | 是 | `POST /api/draw/execute` |
| P1 活动规则 | `/activity/rules` | 是 | `GET /api/activity/rules/detail` |
| P1 我的奖励 | `/activity/rewards` | 是 | `GET /api/reward/center/detail` |
| P1 分享获取次数 | 首页弹层/分享动作 | 否 | `POST /api/share/record` |
| P2 问小璞 | `/activity/explain` | 是 | `GET /api/explain/detail` |
| P4 领取专属福利 | 打开 P5 弹窗 | 否 | 不应立即调领券接口 |
| P5 去领取 | 弹窗内提交手机号 | 否 | `POST /api/benefit/claim`，请求体含 `mobile` |
| P5 提交成功 | 小程序券包页 / 领券中心 | 小程序内自动跳转 | action 带 `claim_token` / `claim_no`，不在 H5 停留成功态 |
| P6 券类去领取 | 小程序券包页 | 小程序内跳转 | 使用后端 action |
| P6 精选好物去看看 | 商品详情页 | 小程序内跳转 | 使用后端 action |
| P6 再抽一次 | `/activity/home` | 是 | 回到首页 |
| P6 活动规则 | `/activity/rules` | 是 | 进入 P7 |
| P6 985 达标去使用 | `/activity/grand-prize` 或后端 action | 是 | 进入 P8/资格承接 |
| P8 返回 | 上一页/P6 | 是 | 历史栈返回 |

## 4. 最新业务规则基线

1. 每个用户每日默认 1 次抽签机会。
2. 用户完成抽签后，后端自动记录 1 天打卡/点亮。
3. 每天最多点亮 1 天。
4. 用户分享好友后，后端记录分享行为。
5. 好友通过分享进入并完成抽签后，原用户增加 1 个助力人数。
6. 每日通过分享最多获得 3 次额外抽签机会。
7. 当天最多 4 次抽签机会：1 次默认 + 3 次分享额外机会。
8. 分享 5 个好友，或累计打卡 7 天，任一满足即可解锁 985 和牛礼盒抽奖资格。
9. 每次成功抽签都可以领取一次本次签文绑定的优惠券，同一用户可拥有多张优惠券，包括重复券码。
10. 同一 `draw_id` 的福利只能领取一次；重复提交返回原领取结果。
11. P4 点击「领取专属福利」只打开 P5 手机号领券弹窗。
12. P5 必须输入手机号并点击「去领取」后，才调用 `POST /api/benefit/claim`。
13. 领券成功后，后端保存手机号、脱敏手机号、`claim_no`、`claim_token` 和发券状态，并由 H5 自动触发小程序券包承接。
14. P6 展示固定奖励位：10 元、20 元、30 元、9 折、7.5 折、985 礼盒。
15. 未领取的普通奖励显示「未领取」，已领取显示「去领取」。
16. P6 最多展示 6 张，985 礼盒永远在最后一个。
17. 985 礼盒未达标显示「未达标」，达标后显示「去使用」。
18. 优惠券点击「去领取」跳小程序券包页，跳转参数只带 `claim_token` / `claim_no`。
19. 精选好物点击「去看看」跳商品详情页。
20. P8 展示抽奖编号、开奖状态、企微二维码。

## 5. 后端接口总览

| 页面 | 接口 | 触发时机 | 作用 |
| --- | --- | --- | --- |
| P1 | `POST /api/h5/session/create` | 首次进入 | 创建/恢复活动 session |
| P1 | `GET /api/activity/state` | 首页加载 | 获取抽签机会、分享次数、活动状态 |
| P1/P2 | `POST /api/draw/execute` | 点击抽签 | 扣减机会、生成 `draw_id`、自动点亮 |
| P2 | `GET /api/draw/result/detail` | 抽签结果页 | 获取签文结果 |
| P2/P4 | `GET /api/explain/detail` | 问小璞后 | 获取 AI 解签、商品福利、领取状态 |
| P5 | `POST /api/benefit/claim` | 输入手机号后点击去领取 | 领取本次 `draw_id` 绑定优惠券，保存手机号和 `claim_token` |
| P5 | `GET /api/benefit/claim/result` | 领取结果补偿查询 | 获取领取结果和去使用动作 |
| 小程序 | `GET /api/benefit/claim/resolve` | 小程序解析 token | 通过 `claim_token` 查领取记录 |
| P1 | `POST /api/share/record` | 分享完成 | 记录分享行为并按上限增加机会 |
| P6 | `GET /api/reward/center/detail` | 进入我的奖励 | 获取进度、奖励、985 状态、商品推荐 |
| P7 | `GET /api/activity/rules/detail` | 进入活动规则 | 获取规则和企微二维码 |

P5 固定券规则：优惠券在 `POST /api/draw/execute` 创建 draw 时已经由后端固定；P4/P5 前端只展示接口返回的当前 draw 固定券，不在打开弹窗时重掷。同一 `draw_id` 重复进入 P5 必须保持同一张券，重新抽签生成新 `draw_id` 才可能换券。
| P8 | `GET /api/grand-prize/qualification/detail` | 进入大奖资格页 | 获取资格、编号、开奖状态 |
| 全局 | `POST /api/tracking/event` | 曝光/点击/异常 | 埋点入库 |

## 6. 当前 P5 覆盖结果

| 模块 | 当前代码 | 最新要求 |
| --- | --- | --- |
| P4 福利按钮 | 只打开 P5 手机号弹窗 | 已符合 |
| P5 展示 | 手机号输入弹窗 + 提交成功后自动跳小程序券包 | 已符合 |
| P5 提交 | 前端校验 11 位手机号后请求后端 | 已符合 |
| 领券接口 | `mobile` 必传，后端二次校验 | 已符合 |
| 数据库 | SQLite/MySQL 已同步补字段和索引 | 已符合 |
| 埋点 | 已补曝光、输入聚焦、提交、校验失败，禁止手机号明文 | 已符合 |
| 测试 | 已改为 P4 打开 P5，P5 提交成功后自动承接券包 | 已符合 |

## 7. 文档一致性结论

1. P1、P2、P4、P5、P6、P7、P8 文档均存在。
2. P5 文档已更新为手机号领券口径。
3. 总览、接口、数据库文档已按 P5 新口径更新为已覆盖状态。
4. 下一步重点是小程序券包页用 `claim_token` 承接的联调确认。
