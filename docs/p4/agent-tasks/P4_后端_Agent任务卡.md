# P4 后端 Agent 任务卡

> 页面名称：P4 AI 解签结果页 / 福利承接页  
> 项目：高考考运摇签 + 牛肉福利领取 H5 活动  
> 任务角色：后端开发 Agent

---

## 一、当前任务

为 P4 提供 AI 解签结果详情、牛肉推荐卡数据和福利入口状态。真正的手机号领券提交属于 P5。

---

## 二、重要限制

1. 只处理 P4 所需接口。
2. 不要扩展未确认的完整奖励中心、企微绑定、商品详情页业务。
3. 不要改变 P1 / P2 已确认业务口径。
4. 福利领取后的最终去向先支持可配置返回，不要写死。
5. 必须处理同一 `draw_id` 的重复领取和已领取状态；不同 `draw_id` 可再次领取同券码。

---

## 三、需要提供的接口

| 接口 | 方法 | 作用 |
|---|---|---|
| `/api/explain/detail` | GET | 获取 AI 解签结果详情 |
| `/api/benefit/claim` | POST | P5 输入手机号后领取当前解签结果对应的专属福利 |
| `/api/tracking/event` | POST | 接收 P4 埋点事件 |

`/api/explain/detail` 需要由后端代理 DeepSeek `/chat/completions`，前端不接触 API Key。配置项包括 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`、`DEEPSEEK_REASONING_EFFORT`、`DEEPSEEK_TIMEOUT_SECONDS`、`DEEPSEEK_MAX_TOKENS`；返回体需包含最终签文、可展示的 `thinkingProcess`、`themeText` 和 `ai.promptVersion`。未配置或调用失败时返回本地兜底，不能阻断页面。

---

## 四、GET /api/explain/detail

### 触发时机

用户进入 P4 时触发。

### 入参建议

| 字段 | 必填 | 说明 |
|---|---|---|
| activity_id | 是 | 活动 ID |
| session_id | 是 | 当前访问会话 |
| draw_id | 是 | 当前抽签结果 ID |
| explain_id | 否 | 已生成的解签 ID，没有时可由后端生成或查询 |

### 返回字段

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "activity_id": "gaokao_lucky_sign_2026",
    "session_id": "string",
    "draw_id": "string",
    "explain_id": "string",
    "sign_type": "金榜题名签",
    "sign_level": "上上签",
    "title": "AI解签结果",
    "explain_lines": [
      "锦绣前程，步步生花",
      "实力如锦，终成佳绩",
      "心之所向，金榜题名"
    ],
    "theme_text": "高考好运 × 牛气补给",
    "product": {
      "product_id": "string",
      "product_name": "和牛 · 锦绣前程板腱",
      "product_image": "https://example.com/product.png"
    },
    "benefit": {
      "benefit_id": "string",
      "claim_status": "unclaimed",
      "claim_button_text": "领取专属福利"
    }
  }
}
```

---

## 五、POST /api/benefit/claim

### 触发时机

P5 手机号领券弹窗中，用户输入手机号并点击「去领取」时触发。P4 点击「领取专属福利」只打开弹窗，不直接触发该接口。

### 入参建议

| 字段 | 必填 | 说明 |
|---|---|---|
| activity_id | 是 | 活动 ID |
| session_id | 是 | 当前访问会话 |
| draw_id | 是 | 当前抽签结果 ID |
| explain_id | 是 | 当前解签 ID |
| benefit_id | 是 | 当前福利 ID |
| openid | 否 | 小程序 / 微信用户标识，接入后使用 |
| mobile | 是 | 用户输入手机号，必须校验 |

### 返回字段

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "activity_id": "gaokao_lucky_sign_2026",
    "session_id": "string",
    "draw_id": "string",
    "explain_id": "string",
    "benefit_id": "string",
    "claim_no": "CL202605210001",
    "claim_token": "ct_xxx",
    "claim_status": "claimed",
    "receiver_mobile_masked": "138****5678",
    "coupon_issue_status": "pending",
    "action": {
      "type": "mini_program_coupon_package",
      "button_text": "去领取",
      "target": "/pages/coupon-package/index?claim_token=ct_xxx&claim_no=CL202605210001"
    }
  }
}
```

---

## 六、领取状态规则

| 状态 | 说明 |
|---|---|
| unclaimed | 未领取，可点击领取 |
| claiming | 前端临时状态，后端无需长期保存 |
| claimed | 当前 `draw_id` 已领取，不允许对同一次抽签重复发放 |
| expired | 活动过期或福利失效 |
| blocked | 用户不满足领取条件 |

---

## 七、异常码建议

| code | 场景 | message |
|---|---|---|
| 0 | 成功 | success |
| 40001 | 参数缺失或手机号格式错误 | 参数错误 |
| 40401 | 解签结果不存在 | 解签结果不存在 |
| 40402 | 福利不存在 | 福利不存在 |
| 40901 | 同一 `draw_id` 重复领取 | 该福利已领取 |
| 41001 | 活动已结束 | 活动已结束 |
| 50001 | 服务异常 | 服务繁忙，请稍后再试 |

---

## 八、埋点字段支持

后端需要保证以下字段可返回或可透传：

1. activity_id；
2. session_id；
3. draw_id；
4. explain_id；
5. sign_type；
6. sign_level；
7. product_id；
8. product_name；
9. benefit_id；
10. claim_status。

---

## 九、交付结果要求

完成后请说明：

1. 新增 / 修改了哪些接口；
2. 请求参数和返回结构；
3. mock 数据位置；
4. 同一 `draw_id` 重复领取如何处理，不同 `draw_id` 如何允许再次领取同券码；
5. 已领取状态如何返回；
6. 领取成功后的 action 如何携带 `claim_token` / `claim_no`，且不携带手机号明文；
7. 如何本地自测接口。
