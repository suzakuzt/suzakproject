# P7 埋点 Agent 任务卡 v1.0

## 当前任务

为 **P7 活动规则页** 接入页面曝光、规则阅读、返回按钮、企微二维码和异常埋点。

## 埋点目标

1. 统计用户是否进入活动规则页。
2. 统计用户从哪个页面进入 P7。
3. 统计用户是否阅读到企微二维码区域。
4. 统计用户是否点击返回。
5. 统计规则配置和二维码加载异常。

## 事件清单

| 事件名 | 触发时机 | 关键参数 |
|---|---|---|
| rules_page_view | 进入 P7 活动规则页 | activity_id、session_id、source_page |
| rules_page_render_success | P7 页面规则渲染成功 | activity_id、session_id、rules_count、has_qrcode |
| rules_page_render_fail | P7 规则配置加载失败或渲染失败 | activity_id、session_id、error_code、error_msg |
| rules_back_click | 点击左上角返回按钮 | activity_id、session_id、source_page、fallback_used |
| rules_qrcode_exposure | 企微二维码进入可视区域 | activity_id、session_id、qrcode_id |
| rules_qrcode_click | 点击二维码预览时触发，如果有预览能力 | activity_id、session_id、qrcode_id |
| rules_scroll_to_bottom | 用户滚动到页面底部 | activity_id、session_id |
| rules_qrcode_load_fail | 企微二维码加载失败 | activity_id、session_id、qrcode_id、error_code、error_msg |

## 参数说明

| 参数 | 说明 |
|---|---|
| activity_id | 活动 ID |
| session_id | 当前会话 ID |
| source_page | 来源页面，例如 P1 / P6 / direct |
| rules_count | 渲染规则条数，正常为 7 |
| has_qrcode | 是否成功拿到二维码资源 |
| qrcode_id | 企微二维码配置 ID |
| fallback_used | 返回按钮是否使用了无历史栈兜底 |
| error_code | 异常码 |
| error_msg | 异常信息 |

## 实现要求

1. 页面进入时触发 rules_page_view。
2. 规则列表渲染成功后触发 rules_page_render_success。
3. 规则接口失败或规则渲染异常时触发 rules_page_render_fail。
4. 返回按钮点击时触发 rules_back_click。
5. 企微二维码首次进入可视区域时触发 rules_qrcode_exposure，仅触发一次。
6. 如果二维码支持点击预览，则点击时触发 rules_qrcode_click。
7. 用户滚动到底部时触发 rules_scroll_to_bottom，仅触发一次。
8. 二维码图片加载失败时触发 rules_qrcode_load_fail。

## 交付结果

1. 已接入的事件列表。
2. 每个事件的触发位置。
3. 参数来源说明。
4. 自测截图 / 日志。
5. 是否存在未接入或待后端补充的参数。
