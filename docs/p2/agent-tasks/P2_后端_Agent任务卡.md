# P2 后端 Agent 任务卡

# 项目背景

项目：高考考运摇签 + 牛肉福利领取 H5 活动  
页面：P2 今日考运签结果页 / 解签入口页  
状态：基于主设计图整理，待确认后可进入 Agent 开发拆分

## 你的角色

你是本项目的后端 Agent，只负责 P2 结果页所需的结果详情、解签内容、抽签完成后的打卡 / 点亮记录和海报生成能力。

## 本次任务目标

为 P2 提供稳定的数据接口，让前端能够展示本次抽签结果，并支持问小璞解签、抽签完成后的打卡 / 点亮记录和海报分享。

## 必须实现的能力

### 1. 承接正式抽签结果

接口来源：

```http
POST /api/draw/execute
```

作用：

- P1 点击抽签后生成 `drawId`，扣减机会，并触发当天打卡 / 点亮。
- P2 进入时以 `drawId` 拉取或展示抽签结果。
- `draw/execute` 成功后每天最多点亮 1 天，由后端按用户和自然日去重。

---

### 2. 返回结果页详情

接口建议：

```http
GET /api/draw/result/detail
```

作用：

- 返回本次抽签结果详情；
- 返回签型标签、签等级、主签文、宜 / 忌等字段；
- 返回当前 draw_id 和 session_id。

建议返回：

```json
{
  "activitySessionId": "act_sess_xxx",
  "drawId": "draw_xxx",
  "signType": "金榜题名签",
  "signLevel": "上上签",
  "mainTextLeft": "金榜题名",
  "mainTextRight": "愿你落笔生花",
  "yiText": ["稳住心态", "认真审题", "从容落笔"],
  "jiText": ["慌乱失分", "粗心失分", "临场焦虑"]
}
```

---

### 3. 返回 AI 解签详情

接口建议：

```http
GET /api/explain/detail
```

作用：

- 根据当前 draw_id 返回对应 AI 解签详情、推荐商品和领取状态；
- 供「问小璞」入口进入 P4 使用。

建议返回：

```json
{
  "drawId": "draw_xxx",
  "explainTitle": "AI解签结果",
  "explainLines": ["锦绣前程，步步生花", "实力如锦，终成佳绩", "心之所向，金榜题名"],
  "product": {
    "productId": "sku_001",
    "productName": "和牛 · 锦绣前程板腱",
    "productImage": "string"
  },
  "benefit": {
    "benefitId": "default-benefit",
    "claimStatus": "unclaimed",
    "claimButtonText": "领取专属福利"
  }
}
```

---

### 4. 生成分享海报

接口建议：

```http
POST /api/poster/generate
```

作用：

- 生成当前结果页对应的分享海报；
- 返回海报地址 / 海报标识。

建议返回：

```json
{
  "drawId": "draw_xxx",
  "posterId": "poster_xxx",
  "posterUrl": "https://example.com/poster_xxx.png"
}
```

---

### 5. 记录打卡 / 点亮

接口建议：

```http
POST /api/checkin/record
```

作用：

- 用户完成抽签后记录 1 天打卡 / 点亮；
- 每天最多点亮 1 天，由后端按用户和自然日去重；
- 返回最新累计点亮天数，供 P6 我的奖励页读取。
- 建议由 `POST /api/draw/execute` 成功后内部触发，避免前端自行决定点亮。

---

### 6. 埋点基础数据支持

后端需保证能返回或透出：

- activitySessionId
- drawId
- signType
- signLevel

供前端埋点时使用。

## 不要实现

1. 不要在 P2 默认返回商品承接数据，除非后续确认。
2. 不要在 P2 默认返回优惠券或企微二维码数据。
3. 不要把海报生成和复杂社交裂变规则强耦合在本页。
4. 不要遗漏 drawId / sessionId 等关键标识。
5. 不要让前端自行累加点亮天数。

## 验收标准

1. 能返回完整结果页展示数据。
2. 能返回对应 AI 解签详情。
3. 能生成并返回海报信息。
4. 抽签完成后能按天去重记录打卡 / 点亮，每天最多 1 天。
5. 数据字段命名清晰，便于前端直接消费。
6. 接口失败时返回明确错误码与错误信息。
