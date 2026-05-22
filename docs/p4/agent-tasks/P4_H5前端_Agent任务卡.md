# P4 H5 前端 Agent 任务卡

> 页面名称：P4 AI 解签结果页 / 福利承接页  
> 项目：高考考运摇签 + 牛肉福利领取 H5 活动  
> 任务角色：H5 前端开发 Agent

---

## 一、当前任务

只实现 **P4 AI 解签结果页 / 福利承接页**。

本页用于承接 P2「问小璞」动作，展示 AI 解签结果，并引导用户点击「领取专属福利」。

---

## 二、重要限制

1. 只处理 P4，不要开发 P1、P2、P6、活动规则页或其他页面的完整业务。
2. 不要新增未确认的业务规则。
3. 不要私自增加「再抽一次」「点击分享海报」「我的奖励」「企微二维码」「券列表」等模块。
4. 不要把 AI 解签正文做成整张图片，正文必须支持动态文本渲染。
5. 牛肉商品图和商品名称要保留动态配置能力。
6. 点击「领取专属福利」后打开 P5 手机号领券弹窗；P5 提交手机号成功后，P6 我的奖励展示 `display_rewards`，已领取券显示「去领取」，未领取券显示「未领取」。
7. 不要改动与 P4 无关的页面。

---

## 三、输入资料

- `P4_AI解签结果页确认版_Agent交付卡.md`
- P4 主设计稿
- 当前项目目录结构
- 当前前端技术栈说明
- 当前路由配置说明
- 当前接口封装 / mock 数据规范

---

## 四、P4 已确认规则

1. P4 是 AI 解签结果展示页。
2. 用户从 P2 点击「问小璞」后进入 P4。
3. 页面标题固定为「AI解签结果」。
4. 中部解签文案支持动态渲染。
5. 当前设计稿示例文案为：
   - 锦绣前程，步步生花
   - 实力如锦，终成佳绩
   - 心之所向，金榜题名
6. 主题标签固定展示「高考好运 × 牛气补给」。
7. 牛肉推荐卡展示商品图片与商品名称。
8. 商品名称示例为「和牛 · 锦绣前程板腱」，不建议写死。
9. 主按钮固定为「领取专属福利」。
10. 顶部挂绳、底部绳结、分割线、边框装饰均为视觉装饰，不可点击。

---

## 五、需要实现

1. 按 P4 主设计稿还原页面视觉：
   - 红色丝绒背景；
   - 米金吊牌主卡；
   - 红金标题牌；
   - AI 解签正文；
   - 主题标签；
   - 牛肉商品卡；
   - 红金 CTA 按钮。
2. 实现 AI 解签文案动态渲染：
   - 支持数组形式 `explain_lines`；
   - 支持 2～4 行兜底展示；
   - 文案为空时有兜底提示。
3. 实现商品推荐卡动态渲染：
   - `product_image`；
   - `product_name`；
   - 图片失败时展示兜底图。
4. 实现「领取专属福利」按钮：
   - 未领取状态：展示「领取专属福利」；
   - 点击后打开 P5 手机号领券弹窗；
   - P4 不直接调用 `POST /api/benefit/claim`；
   - 已领取：按后端状态展示已领取或进入已领取结果反馈。
5. 实现基础状态：
   - AI 解签加载中，展示「AI 解签中」和可展示的 `thinkingProcess` 短句/点状动效；
   - AI 解签加载失败；
   - 商品图片加载失败；
   - P5 弹窗打开；
   - P5 提交成功；
   - P5 提交失败；
   - 已领取。
6. 接入或预留接口：
   - `GET /api/explain/detail`；
   - P5 内部调用 `POST /api/benefit/claim`；
   - 成功后渲染 `explainLines`、`themeText` 和商品福利，不展示模型内部推理。
   - `POST /api/tracking/event`。
7. 按埋点表触发事件：
   - `ai_explain_page_view`；
   - `ai_explain_render_success`；
   - `ai_explain_load_fail`；
   - `ai_explain_product_exposure`；
   - `exclusive_benefit_click`；
   - `benefit_mobile_popup_view`；
   - `ai_explain_page_back`。

---

## 六、建议数据结构

```ts
type P4ExplainDetail = {
  activity_id: string
  session_id: string
  draw_id: string
  explain_id: string
  sign_type?: string
  sign_level?: string
  title: string
  explain_lines: string[]
  theme_text: string
  product?: {
    product_id: string
    product_name: string
    product_image: string
  }
  benefit?: {
    benefit_id: string
    claim_status: 'unclaimed' | 'claiming' | 'claimed'
    claim_button_text: string
  }
}
```

---

## 七、自测清单

1. P2 点击「问小璞」后能进入 P4。
2. 页面标题固定展示「AI解签结果」。
3. AI 解签正文可以通过 mock 数据替换。
4. 商品图片可以通过 mock 数据替换。
5. 商品名称可以通过 mock 数据替换。
6. 图片加载失败时有兜底。
7. 点击「领取专属福利」只打开一次 P5 弹窗，不触发领券请求。
8. P5 打开中不能重复打开。
9. 领取失败时有提示。
10. 页面不出现未确认模块。
11. 移动端 375 / 390 / 414 / 430 宽度显示正常。
12. `lint / build / test` 通过或说明失败原因。

---

## 八、交付结果要求

完成后请说明：

1. 修改了哪些文件；
2. 新增了哪些文件；
3. P4 页面如何访问；
4. 使用了哪些 mock 数据；
5. 哪些接口仍是占位；
6. 如何自测；
7. `lint / build / test` 执行结果。
