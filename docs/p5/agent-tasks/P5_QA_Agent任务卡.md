# P5 QA Agent 任务卡

> 页面名称：P5 手机号领券弹窗 / 优惠券领取承接层

## 任务目标

验证 P5 已从“领取成功页”改为“手机号领券弹窗”，并确保手机号保存、领取记录、`claim_token` 小程序承接、P6 展示关系都符合最新口径。

## 主流程用例

| 用例 | 前置条件 | 操作 | 预期 |
|---|---|---|---|
| P5-001 | P4 未领取 | 点击「领取专属福利」 | 打开 P5 手机号领券弹窗 |
| P5-002 | P5 弹窗打开 | 查看页面 | 展示「领取优惠券」、手机号输入框、优惠券卡、「去领取」 |
| P5-003 | 手机号为空 | 点击「去领取」 | 提示「请输入手机号」，不发接口 |
| P5-004 | 手机号格式错误 | 点击「去领取」 | 提示「请输入正确手机号」，不发接口 |
| P5-005 | 手机号正确 | 点击「去领取」 | 调用 `POST /api/benefit/claim`，请求体含 `mobile` |
| P5-006 | 接口成功 | 查看响应 | 返回 `claim_no`、`claim_token`、券信息和 action |
| P5-007 | 接口成功 | 查看数据库 | `reward_claim_record` 保存手机号和 claim token |
| P5-008 | 接口成功 | 点击或触发去领取承接 | 小程序路径携带 `claim_token` / `claim_no`，不携带手机号 |
| P5-009 | 领取成功后进入 P6 | 查看我的奖励 | 已领取券展示可用状态 |
| P5-010 | 同一 draw 重复打开 P5 | 关闭后再次点击「领取专属福利」 | 优惠券图片和 `reward_code` 保持一致 |
| P5-011 | 重新抽签生成新 draw | 再次进入 P5 | 可分配五券池中的下一张券 |
| P5-012 | claim 传错 `reward_code` | 调用 `POST /api/benefit/claim` | 后端拒绝，不生成领取记录 |

## 异常用例

| 用例 | 场景 | 预期 |
|---|---|---|
| P5-E001 | 重复点击「去领取」 | 只发一次请求 |
| P5-E002 | 网络失败 | 展示「领取失败，请稍后重试」 |
| P5-E003 | 后端返回手机号错误 | 展示对应错误，不进入成功态 |
| P5-E004 | 重复提交同一 draw/reward | 返回已有领取记录，不重复发券 |
| P5-E005 | action 缺失 | 领取成功，但提示领券入口暂未开放 |
| P5-E006 | 小程序跳转失败 | 展示跳转失败提示 |
| P5-E007 | 关闭弹窗未提交 | 不生成领取成功记录，P6 不展示已领取 |

## 数据库检查

领取成功后检查：

1. `reward_claim_record.receiver_mobile` 有值。
2. `reward_claim_record.receiver_mobile_masked` 有值。
3. `reward_claim_record.claim_token` 有值且唯一。
4. `reward_claim_record.coupon_issue_status` 有值。
5. `reward_claim_record.claim_status` 为成功状态。

## 埋点检查

1. 弹窗曝光触发 `benefit_mobile_popup_view`。
2. 输入聚焦触发 `benefit_mobile_input_focus`。
3. 提交触发 `benefit_mobile_submit_click`。
4. 校验失败触发 `benefit_mobile_validate_fail`。
5. 领取成功触发 `exclusive_benefit_claim_success`。
6. 埋点中不得出现手机号明文。

## 回归范围

1. P4 AI 解签展示不受影响。
2. P4 领取按钮仍可打开弹窗。
3. P6 仍按 `display_rewards` 展示 6 个固定奖励位。
4. P6 未领取券仍显示「未领取」。
5. P8 985 礼盒资格逻辑不受影响。
