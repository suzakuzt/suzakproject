# P4 埋点 Agent 任务卡

> 页面名称：P4 AI 解签结果页 / 福利承接页  
> 项目：高考考运摇签 + 牛肉福利领取 H5 活动  
> 任务角色：埋点 Agent

---

## 一、当前任务

为 P4 实现页面曝光、渲染成功、AI 解签失败、商品曝光、福利领取点击、领取成功 / 失败、返回等埋点。

---

## 二、重要限制

1. 只处理 P4 埋点。
2. 不要修改 P1 / P2 / P6 的埋点定义。
3. 埋点失败不能阻断用户主流程。
4. 所有事件必须携带 session_id、draw_id，能拿到 explain_id 时必须携带 explain_id。

---

## 三、事件清单

| 事件名 | 触发时机 | 必填参数 |
|---|---|---|
| ai_explain_page_view | 进入 P4 | activity_id、session_id、draw_id、explain_id、sign_type、sign_level |
| ai_explain_render_success | P4 渲染成功 | activity_id、session_id、draw_id、explain_id |
| ai_explain_load_fail | AI 解签结果加载失败 | activity_id、session_id、draw_id、error_code、error_msg |
| ai_explain_product_exposure | 牛肉推荐卡曝光 | activity_id、session_id、draw_id、explain_id、product_id、product_name |
| exclusive_benefit_click | 点击「领取专属福利」 | activity_id、session_id、draw_id、explain_id、benefit_id、product_id |
| exclusive_benefit_claim_success | 福利领取成功 | activity_id、session_id、draw_id、explain_id、benefit_id、claim_status |
| exclusive_benefit_claim_fail | 福利领取失败 | activity_id、session_id、draw_id、explain_id、benefit_id、error_code、error_msg |
| ai_explain_page_back | 用户从 P4 返回上一页 | activity_id、session_id、draw_id、explain_id |

---

## 四、事件触发规则

### 4.1 ai_explain_page_view

进入 P4 页面时触发一次。

要求：

1. 页面首次进入触发；
2. 不要因组件重复渲染重复上报；
3. draw_id 缺失时仍可上报，但需要带 error_context。

### 4.2 ai_explain_render_success

AI 解签数据加载成功并完成页面渲染后触发。

要求：

1. explain_lines 成功渲染；
2. 商品卡区域完成渲染；
3. 只上报一次。

### 4.3 ai_explain_load_fail

AI 解签结果接口失败或核心字段缺失时触发。

要求：

1. 携带 error_code；
2. 携带 error_msg；
3. 不阻断异常 UI 展示。

### 4.4 ai_explain_product_exposure

牛肉推荐卡进入可视区域时触发。

要求：

1. 商品卡真正曝光再上报；
2. 同一页面生命周期内同一个 product_id 只上报一次；
3. product_id 缺失时用 `unknown`。

### 4.5 exclusive_benefit_click

点击「领取专属福利」时立即触发。

要求：

1. 点击即上报；
2. 领取接口成功或失败另行上报；
3. 防重复点击期间不要重复上报。

### 4.6 exclusive_benefit_claim_success

福利领取接口返回成功时触发。

要求：

1. 携带 claim_status；
2. 携带 benefit_id；
3. 如有 next_action，可扩展上报 next_action_type。

### 4.7 exclusive_benefit_claim_fail

福利领取接口失败时触发。

要求：

1. 携带 error_code；
2. 携带 error_msg；
3. 包含 benefit_id。

### 4.8 ai_explain_page_back

用户点击返回、浏览器返回或小程序返回时触发。

---

## 五、公共参数

| 参数 | 说明 |
|---|---|
| activity_id | 活动 ID |
| session_id | 当前会话 ID |
| user_id | 用户 ID，若未登录可为空 |
| openid | 小程序 openid，接入后使用 |
| draw_id | 抽签结果 ID |
| explain_id | AI 解签结果 ID |
| sign_type | 签型 |
| sign_level | 签等级 |
| product_id | 推荐商品 ID |
| benefit_id | 福利 ID |
| page_code | 固定为 P4_AI_EXPLAIN_RESULT |
| timestamp | 事件时间 |

---

## 六、验收标准

1. P4 首次进入只触发一次 `ai_explain_page_view`。
2. 页面渲染成功只触发一次 `ai_explain_render_success`。
3. 商品卡曝光只触发一次 `ai_explain_product_exposure`。
4. 点击领取时触发 `exclusive_benefit_click`。
5. 领取成功触发 `exclusive_benefit_claim_success`。
6. 领取失败触发 `exclusive_benefit_claim_fail`。
7. 解签加载失败触发 `ai_explain_load_fail`。
8. 埋点失败不影响页面展示和按钮点击。
