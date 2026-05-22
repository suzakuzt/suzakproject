# P1 埋点 Agent 任务卡

# 项目背景

项目：高考考运摇签 + 牛肉福利领取 H5 活动  
页面：P1 活动首页 / 活动入口页  
状态：P1 已确认，可进入 Agent 开发拆分

## P1 已确认业务口径

1. 主按钮固定为「立即摇签」。
2. 新用户默认展示「我的摇签机会 1次」。
3. 签筒上的 5 支签不参与真实签文池，仅作为首页视觉装饰和后续动态效果展示。
4. 点击签筒与点击「立即摇签」逻辑一致，都触发摇签流程。
5. 「活动规则」跳转活动规则独立页面，不使用弹窗。
6. 「我的奖励」点击后跳转 P6 我的考运进度 / 我的奖励页面。
7. 分享行为不限制；每日最多奖励 3 次摇签机会；超过 3 次后继续允许分享，但不再增加机会。
8. 首页不设置「今日已摇签」按钮。
9. 有额外摇签机会时，主按钮不变，仍为「立即摇签」；只更新底部摇签机会数量。
10. P1 不处理活动结束态；活动结束后活动入口直接下架。


---

## 你的角色

你是本项目的埋点 Agent，只负责 P1 活动首页的页面曝光、按钮点击、分享奖励、异常状态等数据事件定义与实现要求。

## 本次任务目标

确保 P1 首页关键行为可追踪，为后续分析访问、摇签入口点击、分享获取机会、奖励入口点击等数据提供完整埋点。

## 必须覆盖的事件

| 事件名 | 触发时机 | 关键参数 |
|---|---|---|
| `h5_activity_visit` | 用户进入 H5 首页 | `activity_id`、`session_id`、`channel`、`invite_code` |
| `activity_home_view` | 首页渲染完成 | `session_id`、`draw_chance`、`share_count_today` |
| `draw_entry_click` | 点击「立即摇签」 | `session_id`、`draw_chance` |
| `draw_tube_click` | 点击签筒 | `session_id`、`draw_chance` |
| `rule_click` | 点击活动规则 | `session_id` |
| `my_reward_click` | 点击我的奖励 | `session_id` |
| `share_get_chance_click` | 点击分享获取次数 | `session_id`、`share_count_today` |
| `share_chance_add_success` | 分享后机会增加成功 | `session_id`、`share_count_today`、`draw_chance` |
| `draw_no_chance_view` | 无摇签机会提示曝光 | `session_id` |
| `activity_home_load_error` | 首页加载失败 | `error_code`、`error_msg` |

## 分享相关埋点规则

1. 分享行为不限制。
2. 每日最多奖励 3 次摇签机会。
3. 超过 3 次后继续允许分享，但不再增加机会。
4. 不要把「分享超过 3 次」设计成用户负向事件。
5. 如需内部记录超过奖励上限的分享，可使用内部事件，不影响前端体验。

可选内部事件：

| 事件名 | 触发时机 | 说明 |
|---|---|---|
| `share_chance_reward_skip` | 分享奖励次数已满但用户继续分享 | 仅用于内部分析，不用于前端提示拦截 |

## 参数要求

所有事件建议带上以下公共参数：

```json
{
  "activity_id": "gaokao_2026",
  "session_id": "act_sess_xxx",
  "page_id": "P1",
  "page_name": "activity_home",
  "channel": "wechat_group",
  "invite_code": "optional",
  "timestamp": 1710000000000
}
```

## 事件触发要求

### 首页访问

- 页面进入时触发 `h5_activity_visit`。
- 首页数据加载并成功渲染后触发 `activity_home_view`。

### 摇签入口

- 点击主按钮触发 `draw_entry_click`。
- 点击签筒触发 `draw_tube_click`。
- 如果机会为 0，展示无机会提示时触发 `draw_no_chance_view`。

### 辅助入口

- 点击活动规则触发 `rule_click`。
- 点击我的奖励触发 `my_reward_click`。
- 点击分享获取次数触发 `share_get_chance_click`。

### 分享奖励

- 分享后机会增加成功，触发 `share_chance_add_success`。
- 超过每日 3 次后，不触发成功事件；如需记录，触发可选内部事件 `share_chance_reward_skip`。

### 异常

- 首页接口失败或渲染失败时触发 `activity_home_load_error`。

## 不要实现

1. 不要新增未确认的业务事件。
2. 不要将签筒 5 支签作为真实签文结果上报。
3. 不要将活动结束 / 查看开奖结果作为 P1 事件。
4. 不要把分享超过 3 次定义成用户失败事件。
5. 不要收集手机号、真实姓名等非必要个人信息。

## 验收标准

1. 首页进入和渲染成功都有事件。
2. 点击主按钮和点击签筒能区分记录。
3. 点击活动规则、我的奖励、分享获取次数均有事件。
4. 无机会提示曝光能被记录。
5. 分享奖励成功能记录奖励后的次数和机会数。
6. 分享超过 3 次后，不影响继续分享。
7. 异常加载能记录错误码和错误信息。
8. 所有事件都带 `session_id` 和 `activity_id`。
