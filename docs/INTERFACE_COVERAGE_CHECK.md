# 前后端接口覆盖检查

> 更新时间：2026-05-21  
> 结论：首轮本地主流程已跑通，P5 已按「手机号领券弹窗」完成前后端改造。P4 点击只打开弹窗，P5 提交手机号后才调用领券接口，并保存手机号、`claim_no`、`claim_token` 和发券状态；保存成功后 H5 自动按 action 承接到小程序券包 / 领券中心。

## 当前接口口径

| 项目 | 当前约定 |
| --- | --- |
| 前端请求基准 | 同域 `/api` |
| 本地代理 | Vite 将 `/api` 代理到 `http://127.0.0.1:8000` |
| 活动首页 | `/activity/home` |
| 抽签结果 | `/activity/result` |
| AI 解签 | `/activity/explain` |
| 我的奖励 | `/activity/rewards` |
| 活动规则 | `/activity/rules` |
| 985 资格 | `/activity/grand-prize` |
| 分享入口 | `/activity/home?share_token=xxx` |
| P5 定位 | P4 内手机号领券弹窗，无独立路由 |

## 主流程接口

| 页面/模块 | 接口 | 触发点 | 当前实现 | 最新要求 |
| --- | --- | --- | --- | --- |
| H5 会话 | `POST /api/h5/session/create` | 页面初始化 | 已接入 | 保持 |
| 活动状态 | `GET /api/activity/state` | 首页加载/恢复状态 | 后端已实现，前端未主动调用 | 后续可用于状态恢复 |
| 抽签 | `POST /api/draw/execute` | P1 点击抽签 | 已接入 | 保持，成功后自动点亮 |
| 抽签结果 | `GET /api/draw/result/detail` | P2 加载 | 已接入 | 保持 |
| AI 解签 | `GET /api/explain/detail` | P2 问小璞 | 已接入 | 返回福利状态和本次可领取奖励 |
| P5 固定券查询兼容 | `POST /api/benefit/randomize` | 旧入口兼容/异常恢复 | 已接入 | 返回当前 `draw_id` 已固定的券，不重新绑定、不排除、不重掷 |
| P5 领券 | `POST /api/benefit/claim` | P5 输入手机号后点击「去领取」 | 已接入 | 必须携带并校验 `mobile`，保存 `claim_no` / `claim_token` |
| 领取结果 | `GET /api/benefit/claim/result` | 领券结果补偿查询 | 后端已实现 | 返回脱敏手机号、券信息、发券状态和 action |
| 小程序解析 | `GET /api/benefit/claim/resolve` | 小程序通过 `claim_token` 查询 | 已实现 | 后续给小程序/商城承接使用 |
| 分享记录 | `POST /api/share/record` | 分享完成 | 已接入 | 保持，每日最多加 3 次机会 |
| 我的奖励 | `GET /api/reward/center/detail` | 进入 P6 | 已接入 | P6 只把成功领取的券标记为可用 |
| 活动规则 | `GET /api/activity/rules/detail` | 进入 P7 | 已接入 | 保持 |
| 985 资格 | `GET /api/grand-prize/qualification/detail` | 进入 P8 | 已接入 | 保持 |
| 埋点 | `POST /api/tracking/event` | 页面曝光/点击/异常 | 已接入 | 已补 P5 手机号弹窗事件 |

## P5 领券请求契约

### `POST /api/benefit/randomize`

用途：旧入口兼容和异常恢复。返回当前 `draw_id` 在抽奖时已经固定的 P5 优惠券，不能重新随机、重新绑定或排除当前券。

请求体：

```json
{
  "session_token": "string",
  "draw_id": 123
}
```

响应体：同 P4 `benefit` 结构，必须返回 `reward.imageUrl` / `reward.image_url`。

P5 当前券池包含 5 张券：`coupon_10`、`coupon_20`、`coupon_30`、`discount_9`、`discount_75`。券在 `POST /api/draw/execute` 创建 draw 时固定写入 `draw_record.result_summary_json.reward_code` / `rewardCode`；同一 `draw_id` 反复打开 P5 必须保持同一张券，重新抽签生成新 `draw_id` 才可能换券。`POST /api/benefit/claim` 必须校验传入 `reward_code` 与 draw 固定券一致。

### P5 图片配置口径

P5 优惠券图不在前端按券码写死。后端按以下优先级返回图片：

1. `reward_config.ext_json.p5_image_url`
2. `activity_asset_config.fallback_url`
3. `reward_config.reward_image_url`

前端只展示接口返回的 `reward.imageUrl` / `reward.image_url`。因此替换 P5 券图时，运营或后端只需要更新 `activity_asset_config.fallback_url` 或 `reward_config.ext_json.p5_image_url`，不需要改前端代码。

### `POST /api/benefit/claim`

请求体：

```json
{
  "session_token": "string",
  "draw_id": "string",
  "reward_code": "coupon_10",
  "mobile": "13812345678",
  "claim_channel": "h5"
}
```

响应体建议：

```json
{
  "success": true,
  "claim_id": "123",
  "claim_no": "CL202605210001",
  "claim_token": "ct_xxx",
  "claim_status": "claimed",
  "receiver_mobile_masked": "138****5678",
  "coupon_issue_status": "pending",
  "reward": {
    "reward_code": "coupon_10",
    "reward_type": "coupon",
    "reward_name": "10元无门槛券",
    "reward_image_url": "/assets/p6/coupon-10.png"
  },
  "action": {
    "type": "mini_program_coupon_package",
    "button_text": "去领取",
    "target": "/pages/coupon-package/index?claim_token=ct_xxx&claim_no=CL202605210001"
  }
}
```

接口边界：

1. 缺少手机号或手机号格式错误时返回业务错误，不写入领取成功记录。
2. 同一 `draw_id + reward_code` 只能领取一次；重复提交返回原领取记录。
3. 不同 `draw_id` 可以领取同一个 `reward_code`，允许用户拥有多张重复优惠券。
4. action 只允许携带 `claim_token` / `claim_no`，禁止携带手机号明文。

## 埋点覆盖

| 页面/模块 | 关键事件 |
| --- | --- |
| 活动首页 | `activity_home_view`、`draw_entry_click`、`draw_no_chance_view`、`rule_click`、`my_reward_click`、`share_get_chance_click` |
| 抽签结果 | `result_page_view`、`result_page_render_success`、`ask_xiaopu_click`、`share_poster_click` |
| AI 解签 | `ai_explain_page_view`、`ai_explain_render_success`、`ai_explain_product_exposure`、`exclusive_benefit_click` |
| P5 手机号领券 | `benefit_mobile_popup_view`、`benefit_mobile_input_focus`、`benefit_mobile_submit_click`、`benefit_mobile_validate_fail`、`exclusive_benefit_claim_success/fail`、`coupon_card_exposure`、`use_benefit_click`、`use_benefit_redirect_success/fail` |
| 我的奖励 | `reward_center_page_view`、`progress_module_exposure`、`reward_card_exposure`、`reward_use_click`、`product_recommend_click`、`draw_again_click`、`activity_rules_click` |
| 活动规则 | `rules_page_view`、`rules_qrcode_exposure`、`rules_scroll_to_bottom` |
| 985 资格 | `grand_prize_page_view`、`grand_prize_status_exposure`、`grand_prize_qrcode_exposure` |

P5 埋点隐私要求：不上传手机号明文；如需要确认是否填写，只传 `has_mobile: true` 或 `receiver_mobile_masked`。

## 数据库表使用结论

当前 SQLite 16 张表均有业务用途，`reward_claim_record` 已补 P5 手机号领券字段。

| 表 | 使用状态 |
| --- | --- |
| `activity_config` | 已用，活动基础配置 |
| `activity_asset_config` | 已用，图片和二维码配置 |
| `product_recommend_config` | 已用，精选好物配置 |
| `reward_config` | 已用，优惠券和 985 礼盒配置 |
| `draw_result_config` | 已用，签文配置 |
| `activity_user` | 已用，H5 用户 |
| `activity_session` | 已用，会话和分享来源 |
| `user_daily_state` | 已用，每日机会和点亮状态 |
| `draw_record` | 已用，抽签记录 |
| `draw_chance_log` | 已用，机会流水 |
| `checkin_record` | 已用，每日点亮 |
| `share_record` | 已用，分享行为 |
| `share_assist_record` | 已用，好友助力 |
| `reward_claim_record` | 已用，保存手机号、领取 token、发券状态字段 |
| `grand_prize_qualification` | 已用，985 资格和抽奖编号 |
| `tracking_event` | 已用，埋点入库 |

## 当前覆盖结果

| 检查点 | 当前代码/脚本 | 最新文档要求 |
| --- | --- | --- |
| P4 点击福利 | 只打开 P5 手机号弹窗 | 已符合 |
| P5 UI | 手机号输入 + 去领取 + 成功后自动承接小程序 | 已符合 |
| 领券请求 | `mobile` 必传，前后端都校验 | 已符合 |
| 数据库 | `reward_claim_record` 已补 `receiver_mobile`、`receiver_mobile_masked`、`claim_token`、`coupon_issue_status` 等 | 已符合 |
| 小程序跳转 | 券包路径带 `claim_token` / `claim_no`，不带手机号 | 已符合 |
| P5 埋点 | 已补手机号弹窗曝光、输入、提交、校验失败 | 已符合 |
| 测试 | 已断言“P4 打开 P5，P5 提交后领券” | 已符合 |
| P6 985 达标按钮 | 达标显示「去使用」 | 已符合 |

## 暂未覆盖能力

| 接口/能力 | 原因 | 建议阶段 |
| --- | --- | --- |
| 跨设备稳定身份 | 当前本地 H5 依赖浏览器本地 key | 小程序 WebView 联调时由小程序传 `openid` / `unionid` / `member_id` |
| `POST /api/poster/generate` | 分享海报仍是前端占位 | 主流程稳定后 |
| `POST /api/reward/use` | 当前可直接使用 action 跳转并用埋点记录 | 需要独立核销/使用状态时补 |
| `POST /api/product/recommend/click` | 当前可直接使用商品 action | 需要服务端单独统计商品点击时补 |
