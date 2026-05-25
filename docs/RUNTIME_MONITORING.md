# 前端运行日志和监控

前端运行监控集中在 `src/utils/runtimeMonitor.js`，由 `src/App.vue` 在页面挂载时安装。监控不会显示任何浮层，也不会阻断用户流程。

## 1. 已移除的调试浮层

原右上角开发调试浮层“接口 POST 200”不再渲染。底层接口请求仍会正常执行，问题排查改走埋点和运行日志。

## 2. 监控范围

| 事件 | 等级 | 触发条件 |
| --- | --- | --- |
| `runtime_page_node_missing` | warning | 当前页面关键 DOM 节点缺失 |
| `runtime_console_warning` | warning | 前端调用 `console.warn` |
| `runtime_console_error` | error | 前端调用 `console.error` |
| `runtime_resource_load_error` | error | 图片、脚本、样式等资源加载失败 |
| `runtime_unhandled_error` | error | window 未捕获异常 |
| `runtime_unhandled_rejection` | error | 未捕获 Promise rejection |

## 3. 关键节点检查

| 页面 | 必检节点 |
| --- | --- |
| P1 首页 | `.home-stage`、`.lottery-tube`、`.draw-button` |
| P2/P4 结果页 | `[data-testid="p2-combined-card"]`、`[data-testid="p2-product-image"]`、`[data-testid="share-poster"]` |
| P6 我的奖励 | `.p6-stage`、`[data-testid="p6-rules"]` |
| P7 活动规则 | `.p7-stage` |
| P8 大奖资格 | `.p8-stage` |

页面切换后会重新检查一次。相同页面、相同节点只上报一次，避免刷屏。

## 4. 上报方式

监控复用现有埋点接口：

```text
POST /api/tracking/event
```

前端通过 `trackEvent(eventName, payload)` 上报。payload 会带上：

- `page_code`
- `location_href`
- `level`
- `source`
- `message` 或 `selector`
- 资源失败时的 `tag_name` 和 `resource_url`

## 5. 排查建议

- 页面空白或布局缺失：先看 `runtime_page_node_missing`。
- 图片、二维码不显示：先看 `runtime_resource_load_error`。
- 业务接口失败：看原有业务失败事件，例如 `result_page_load_error`、`reward_center_load_fail`。
- 代码异常：看 `runtime_unhandled_error` 和 `runtime_unhandled_rejection`。

## 6. 验证

```powershell
npm test -- src/App.test.js
```

测试覆盖：

- 右上角接口调试浮层不再渲染。
- 关键节点缺失会记录 `runtime_page_node_missing`。
- `console.warn` 会记录 `runtime_console_warning`。
- 资源加载失败会记录 `runtime_resource_load_error`。
