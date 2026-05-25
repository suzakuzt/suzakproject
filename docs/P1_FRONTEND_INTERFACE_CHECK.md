# P1 首页前端和接口确认

P1 是活动入口页，路由为 `/activity/home`。页面负责创建会话、展示今日机会、触发抽签、分享加次数，并跳转到奖励中心和规则页。

## 1. 前端入口

| 内容 | 文件 |
| --- | --- |
| 页面渲染 | `src/App.vue` |
| 状态和动作 | `src/composables/useP1Activity.js` |
| 接口封装 | `src/api/activityApi.js` |
| 首页素材 | `public/assets/home/` |

## 2. 页面动作

| 动作 | 前端方法 | 结果 |
| --- | --- | --- |
| 进入页面 | `ensureSession` | 创建/恢复 `session_token`，加载每日机会 |
| 点击立即抽签 | `handleDraw('button')` | 调抽签接口，成功后进入 `/activity/result` |
| 点击签筒 | `handleDraw('tube')` | 同上 |
| 点击我的奖励 | `goRewards` | 进入 `/activity/rewards` |
| 点击活动规则 | `goRules` | 进入 `/activity/rules` |
| 分享获取次数 | `completeShare` | 调分享接口，最多每日加 3 次 |

## 3. 后端接口

| 接口 | 用途 | 主要表 |
| --- | --- | --- |
| `POST /api/h5/session/create` | 创建会话、初始化每日状态、记录分享来源 | `activity_user`、`activity_session`、`user_daily_state` |
| `GET /api/activity/state` | 状态补偿查询 | `user_daily_state`、`grand_prize_qualification` |
| `POST /api/draw/execute` | 扣机会、固定签文和券、写点亮记录 | `draw_record`、`draw_chance_log`、`checkin_record` |
| `POST /api/share/record` | 生成分享 token、按上限加机会 | `share_record`、`draw_chance_log`、`user_daily_state` |
| `GET /api/reward/center/detail` | P6 奖励中心 | `reward_claim_record`、`grand_prize_qualification` |
| `GET /api/activity/rules/detail` | P7 规则页 | `activity_config`、`activity_asset_config` |

## 4. 前端兜底

- 后端不可用时，测试环境仍可使用本地默认状态渲染页面。
- `session_token` 存在 `sessionStorage`，刷新后可继续使用。
- 抽签中会临时禁用按钮，避免重复点击。
- 机会不足时展示分享引导，不直接进入结果页。
- P1 的“分享获取次数”只负责加抽签机会，接口为 `POST /api/share/record`；P2/P4 的海报弹窗只负责生成分享图片，接口为 `POST /api/poster/save`，两者不要混用。

## 5. 必测点

```powershell
npm test -- src/App.test.js
```

检查项：

- 首页展示 1 次默认机会。
- 立即抽签和签筒都能进入结果页。
- 分享最多加 3 次机会。
- 我的奖励和活动规则路由正确。
