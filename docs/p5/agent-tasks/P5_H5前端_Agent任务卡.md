# P5 H5 前端 Agent 任务卡

> 页面名称：P5 手机号领券弹窗 / 优惠券领取承接层  
> 当前口径：用户必须输入手机号并点击「去领取」后，才会生成领取记录。

## 任务目标

完成 P5 手机号领券弹窗前端实现，让 P4「领取专属福利」进入手机号提交流程，并在领取成功后承接小程序券包跳转。

## 输入资料

1. `docs/p5/P5_手机号领券弹窗确认版_Agent交付卡_v1.1.md` 或当前确认版文档。
2. P5 手机号领券弹窗设计包：`D:\抽签数据\抽签P2\领取成功弹窗P5\设计图.zip`。
3. 现有接口封装：`src/api/activityApi.js`。
4. 现有 P4/P5 浮层代码：`src/App.vue`、`src/composables/useP1Activity.js`。

## 必须实现

1. P4 点击「领取专属福利」后，只打开 P5 手机号弹窗，不立即调用 `POST /api/benefit/claim`。
2. P5 弹窗展示：
   - 标题「领取优惠券」；
   - 手机号输入框，占位「请输入手机号」；
   - 优惠券卡；
   - 「去领取」按钮；
   - 关闭按钮。
3. 手机号输入：
   - 仅允许数字；
   - 最大长度 11；
   - 提交时校验手机号格式；
   - 错误时展示文案。
4. 点击「去领取」：
   - 校验手机号；
   - 校验通过后按钮禁用并显示提交态；
   - 调用 `apiClient.claimBenefit`，请求体包含 `mobile`；
   - 成功后保存 `claim_no`、`claim_token`、券信息和 action；
   - 失败后恢复按钮并提示错误。
5. 领取成功后：
   - P4 领取状态切为 `claimed`；
   - P5 保存领取结果并进入去领取承接；
   - 「去领取」按后端 action 跳转，或成功后自动触发小程序承接。
6. P5 优惠券展示：
   - 只使用当前 draw 后端返回的 `benefit.reward.imageUrl` / `image_url`；
   - 同一 `draw_id` 重复打开 P5 必须保持同一张券；
   - 不在前端本地重新随机券图。
6. 埋点：
   - 手机号弹窗曝光；
   - 输入框聚焦；
   - 提交点击；
   - 校验失败；
   - 领取成功 / 失败；
   - 去领取承接。

## 不允许

1. 不允许在 P4 点击时直接领券。
2. 不允许在 URL 中拼接手机号明文。
3. 不允许把手机号明文写入埋点。
4. 不允许前端伪造领取成功记录。
5. 不允许把小程序券包路径写死在前端。

## 前端状态建议

| 状态 | 含义 |
|---|---|
| `input` | 等待输入手机号 |
| `invalid` | 手机号格式错误 |
| `submitting` | 正在提交领券 |
| `claimed` | 领取成功 |
| `failed` | 领取失败 |
| `redirecting` | 正在跳小程序 |

## 接口请求示例

```js
apiClient.claimBenefit({
  session_token: token,
  draw_id: latestDrawId.value,
  reward_code: p4Detail.value.benefit.rewardCode,
  mobile: p5Mobile.value,
  claim_channel: 'h5',
})
```

## 验收标准

1. P4 点击领取后出现手机号弹窗。
2. 不输入手机号点击「去领取」不会发请求。
3. 错误手机号不会发请求。
4. 正确手机号会调用领取接口。
5. 请求体包含 `mobile`。
6. 成功后返回并保存 `claim_token`。
7. 去领取承接参数中只有 `claim_token` / `claim_no`，没有手机号明文。
8. P6 只展示领取成功后的券。
