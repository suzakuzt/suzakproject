# P2/P4 统一结果页说明

P2 和 P4 现在合并为一个结果页，路由为 `/activity/result`。页面保留签面视觉、真实牛肉产品、AI 解签卷轴、分享保存和领取专属福利。

## 1. 页面结构

| 区域 | 内容 |
| --- | --- |
| 顶部 | `牛气上上签` 标识、`拨云见吉` 标题 |
| 左右签文 | 两侧竖签，展示 `goodFor` 和 `avoid` |
| 产品图 | 4 张真实牛肉产品图轮换展示 |
| AI 解签 | 默认收起，点击横轴后展开签文 |
| 海报弹窗 | 打开分享弹窗，展示签文、二维码和保存按钮，不展示产品图 |
| 领取专属奖励 | 打开 P5 手机号领券弹窗 |

## 2. 前端入口

| 内容 | 文件 |
| --- | --- |
| 页面模板 | `src/App.vue` |
| 页面状态 | `src/composables/useP1Activity.js` |
| 样式 | `src/style.css` |
| 资源 | `public/assets/p4/`、`public/assets/p7/qrcode_wechat_group.png` |

## 3. 关键行为

| 行为 | 方法 | 说明 |
| --- | --- | --- |
| 结果展示 | `handleDraw` 后进入 P2 | 首屏使用抽签接口返回结果 |
| 结果补偿查询 | `retryP2Result` | 根据 `draw_id` 重新拉取结果 |
| AI 卷轴 | `openP2Explain` | 调 `GET /api/explain/detail`，失败用兜底签文 |
| 海报弹窗 | `openP2Poster` | 展示签文和二维码，不展示产品图；弹窗标题语义为“分享” |
| 保存弹窗图片 | `saveP2Poster` | 前端 canvas 生成 PNG，调用 `POST /api/poster/save` 落盘；保存后弹窗切换为生成图预览，并在桌面端尝试触发下载 |
| 领取福利 | `openP2Benefit` | 打开 P5 领券弹窗 |

## 4. 后端接口

| 接口 | 用途 |
| --- | --- |
| `POST /api/draw/execute` | 创建 draw、固定签文、产品和券 |
| `GET /api/draw/result/detail` | 结果页补偿查询 |
| `GET /api/explain/detail` | AI 解签、商品、福利详情 |
| `POST /api/benefit/claim` | P5 提交手机号领券 |
| `POST /api/poster/save` | 保存 P2/P4 分享海报 PNG，返回 `poster_id`、`poster_url`、`byte_size` |
| `GET /api/poster/image/{poster_id}` | 读取已保存海报图片 |

海报图片由前端 canvas 生成，后端只负责保存和返回可读 URL。默认保存到 `backend/data/posters/`，也可用 `GAOKAO_H5_POSTER_DIR` 指定目录。

## 5. 海报弹窗保存说明

| 项目 | 说明 |
| --- | --- |
| 弹窗内容 | `牛气上上签` 横牌、`拨云见吉` 主标题、提示文案、左右签文、活动二维码 |
| 不展示内容 | 牛肉产品图、AI 卷轴、福利按钮不进入海报弹窗 |
| 保存流程 | 点击“保存”后生成 canvas PNG，调用 `POST /api/poster/save`，后端返回 `poster_url` 后在弹窗内显示生成图 |
| 桌面浏览器 | 前端会同时触发 `<a download>` 下载，文件名为 `牛气上上签-时间戳.png` |
| 手机 H5 | 普通 H5 不能稳定直接写入系统相册；保存后需要长按弹窗内生成图，使用浏览器/微信的“保存图片”能力 |
| 小程序/企微 WebView | 若需要一键保存到相册，需要接入 `wx.saveImageToPhotosAlbum` 或宿主 App bridge，并处理相册权限 |
| 后端存储 | 图片文件落 `backend/data/posters/` 或 `GAOKAO_H5_POSTER_DIR`，接口返回 `poster_id` 和 `poster_url` |
| 埋点 | 成功/失败分别记录 `poster_save_success`、`poster_save_fail` |

## 6. 视觉约束

- 牛肉图必须使用真实产品 PNG，不用 AI 重绘。
- 牛肉图保持斜放、自然阴影和居中陈列。
- AI 横轴宽度控制在当前卡片中部，不能碰到两侧中国结。
- 海报弹窗只保留签文和二维码，不展示牛肉产品。
- 底部主按钮为“保存”，右上角小按钮关闭弹窗。
- 保存后的生成图预览需要保留黑色外框，便于手机端长按保存。

## 7. 必测点

```powershell
npm test -- src/App.test.js
```

检查项：

- P2/P4 共用同一页面。
- AI 卷轴默认收起，可展开。
- 产品图 4 张轮换。
- 海报弹窗无产品图，有二维码，有保存按钮和右上角关闭。
- 点击保存后调用 `POST /api/poster/save`，弹窗显示可长按保存的生成图。
- 领取按钮仍进入 P5 逻辑。
