# P5 埋点 Agent 任务卡

> 页面名称：P5 手机号领券弹窗 / 优惠券领取承接层

## 任务目标

补齐 P5 手机号领券链路埋点，覆盖弹窗曝光、手机号输入、提交、校验失败、领取成功 / 失败、优惠券曝光和去领取承接。

## 埋点表

| 事件名 | 触发时机 | 关键参数 |
|---|---|---|
| `benefit_mobile_popup_view` | P5 手机号弹窗曝光 | activity_id、session_id、draw_id、benefit_id、reward_code |
| `benefit_mobile_input_focus` | 手机号输入框聚焦 | session_id、draw_id、benefit_id |
| `benefit_mobile_submit_click` | 点击「去领取」 | session_id、draw_id、benefit_id、reward_code、mobile_valid |
| `benefit_mobile_validate_fail` | 手机号为空或格式错误 | session_id、draw_id、benefit_id、error_code |
| `exclusive_benefit_claim_success` | 后端领券成功 | session_id、draw_id、benefit_id、claim_no、claim_status、coupon_issue_status |
| `exclusive_benefit_claim_fail` | 后端领券失败 | session_id、draw_id、benefit_id、error_code、error_msg |
| `benefit_claim_result_render_success` | 领取成功状态渲染完成 | session_id、benefit_id、claim_no、reward_type、coupon_id |
| `benefit_claim_result_load_fail` | 领取结果查询失败 | session_id、benefit_id、claim_no、error_code、error_msg |
| `coupon_card_exposure` | 优惠券卡曝光 | session_id、benefit_id、claim_no、coupon_id、coupon_name、amount、threshold_text |
| `use_benefit_click` | 点击或自动触发小程序领券承接 | session_id、benefit_id、claim_no、coupon_id、action_type、action_target |
| `use_benefit_redirect_success` | 小程序跳转成功 | session_id、benefit_id、claim_no、coupon_id、action_type、action_target |
| `use_benefit_redirect_fail` | 小程序跳转失败 | session_id、benefit_id、claim_no、coupon_id、action_type、error_code、error_msg |
| `benefit_mobile_popup_close` | 关闭手机号弹窗 | session_id、draw_id、benefit_id、has_input |

## 隐私要求

1. 不上报手机号明文。
2. 不上报完整 `receiver_mobile`。
3. 如确需确认是否填写，只上报 `has_mobile: true` 或 `receiver_mobile_masked`。
4. `claim_token` 可用于技术排查，但默认不进普通分析看板；优先使用 `claim_no`。

## 触发规则

1. P4 点击「领取专属福利」打开 P5 时触发 `benefit_mobile_popup_view`。
2. 输入框第一次聚焦触发 `benefit_mobile_input_focus`。
3. 点击「去领取」立即触发 `benefit_mobile_submit_click`。
4. 手机号校验失败触发 `benefit_mobile_validate_fail`。
5. 后端返回领取成功触发 `exclusive_benefit_claim_success`。
6. 后端返回失败或网络错误触发 `exclusive_benefit_claim_fail`。
7. 成功态渲染后触发 `benefit_claim_result_render_success` 和 `coupon_card_exposure`。
8. 点击或自动触发去领取承接时触发 `use_benefit_click`。
9. 小程序桥调用成功 / 失败分别触发对应跳转结果事件。

## 验收标准

1. 手机号错误时有校验失败埋点。
2. 领取成功埋点包含 `claim_no`，不包含手机号明文。
3. 关闭弹窗但未提交手机号不会触发领取成功埋点。
4. 去领取承接仍保留 action 信息。
