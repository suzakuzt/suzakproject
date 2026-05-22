# P1 后端 Agent 任务卡

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

你是本项目的后端 Agent，只负责 P1 活动首页所需的 session、活动状态、正式抽签执行、分享记录、分享奖励次数和基础数据能力。

## 本次任务目标

为 P1 提供稳定的后端接口，让 H5 首页可以获取用户当前状态、展示剩余摇签机会、执行抽签并生成 draw_id，并处理分享记录、分享增加机会和分享归因规则。

## 必须实现的能力

### 1. 创建 / 恢复 H5 活动会话

接口建议：

```http
POST /api/h5/session/create
```

作用：

- 创建或恢复 `activity_session_id`。
- 识别当前 H5 活动用户。
- 后续所有 P1 行为都基于该 session 记录。

建议返回：

```json
{
  "activitySessionId": "act_sess_xxx",
  "isNewSession": true
}
```

---

### 2. 返回首页活动状态

接口建议：

```http
GET /api/activity/state
```

作用：

- 返回当前用户剩余摇签机会。
- 返回今日通过分享已获得的奖励次数。
- 返回奖励 / 进度基础状态，供「我的奖励」入口使用。

建议返回：

```json
{
  "activitySessionId": "act_sess_xxx",
  "drawChance": 1,
  "shareRewardCountToday": 0,
  "shareRewardLimitToday": 3,
  "rewardStatus": "none"
}
```

规则：

- 新用户默认 `drawChance = 1`。
- 有额外分享奖励时，`drawChance` 增加。
- 首页主按钮不因状态变化而改文案。

---

### 3. 正式抽签执行

接口建议：

```http
POST /api/draw/execute
```

作用：

- 点击「立即摇签」或签筒时校验当前是否有机会。
- 有机会时扣减 1 次抽签机会，并生成 `draw_id`。
- 返回最新 `drawChance`，以及 P2 结果页可用的 `drawId`。
- 抽签成功后由后端内部触发当天打卡 / 点亮，每天最多点亮 1 天。
- 如果当前 session 来自分享链接，好友完成抽签后由后端触发助力归因。

建议返回：

```json
{
  "success": true,
  "drawId": "draw_xxx",
  "drawChance": 0,
  "checkinRecorded": true,
  "assistRecorded": false
}
```

无机会时返回：

```json
{
  "success": false,
  "reason": "no_chance",
  "drawChance": 0,
  "message": "今日机会已用完，分享可再得机会"
}
```

如需要独立预校验，可额外保留 `POST /api/draw/chance/check`，但正式业务闭环必须以 `POST /api/draw/execute` 为准。

---

### 4. 分享记录与奖励机会

接口建议：

```http
POST /api/share/record
```

作用：

- 用户完成一次分享动作后，记录分享行为。
- 返回分享链接 / `share_token`，供好友进入时归因。
- 当日奖励次数未满时，增加 1 次摇签机会。
- 每日最多奖励 3 次摇签机会。
- 分享行为不限制；超过 3 次后继续允许分享，但不再增加机会。

建议返回：

```json
{
  "shareToken": "share_xxx",
  "shareUrl": "https://example.com/activity/home?share_token=share_xxx",
  "rewardAdded": true,
  "drawChance": 2,
  "shareRewardCountToday": 1,
  "shareRewardLimitToday": 3
}
```

超过 3 次后返回：

```json
{
  "rewardAdded": false,
  "drawChance": 3,
  "shareRewardCountToday": 3,
  "shareRewardLimitToday": 3,
  "message": "今日额外机会已领满，继续分享好运"
}
```

注意：

- 该 message 可返回给前端备用，但前端不做负向拦截。
- 不要返回阻止分享的错误状态。

---

### 5. 分享助力归因

接口建议：

```http
POST /api/share/assist/complete
```

作用：

- 好友通过分享链接进入并完成抽签后，为原用户增加 1 个助力人数。
- 建议由后端在好友 `draw/execute` 成功后内部触发。
- 同一好友 / 同一分享关系只能计一次，避免重复助力。

---

## 数据规则

| 规则 | 说明 |
|---|---|
| 新用户默认机会 | 1 次 |
| 分享奖励 | 每次有效分享奖励 1 次摇签机会 |
| 每日分享奖励上限 | 最多奖励 3 次 |
| 分享行为本身 | 不限制 |
| 超过奖励上限后 | 可继续分享，但不再增加机会 |
| 今日已摇签 | P1 不单独返回按钮文案逻辑 |
| 抽签执行 | `draw/execute` 校验机会、扣减机会、生成 draw_id、触发点亮 |
| 分享归因 | session 需保留 share_token，好友完成抽签后给原用户加助力 |
| 活动结束 | P1 不处理；活动结束后入口下架 |

## 不要实现

1. 不要给 P1 返回「今日已摇签」按钮逻辑。
2. 不要给 P1 返回「查看开奖结果」入口。
3. 不要把签筒上的 5 支签作为真实签文池。
4. 不要在分享超过 3 次后阻止用户继续分享。
5. 不要只做机会校验却不提供正式抽签执行闭环。

## 验收标准

1. 新 session 用户默认返回 `drawChance = 1`。
2. `GET /api/activity/state` 能返回剩余摇签机会和今日分享奖励次数。
3. 有机会时，`POST /api/draw/execute` 返回 draw_id，并扣减 1 次机会。
4. 无机会时，`POST /api/draw/execute` 返回 no_chance 和提示文案。
5. `draw/execute` 成功后，后端能按天去重记录打卡 / 点亮。
6. 分享 1 次后，摇签机会 +1。
7. 分享奖励最多增加 3 次。
8. 第 4 次及以后分享不增加机会，但不返回阻止分享的错误。
9. 好友通过分享进入并完成抽签后，原用户助力人数 +1。
10. 所有接口具备基础幂等和重复点击保护。
11. P1 不返回活动结束后的开奖结果入口。
