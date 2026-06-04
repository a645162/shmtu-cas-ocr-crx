# 运行时组件图

> 版本：0.1.0

```
┌────────────────────────────────┐
│  https://cas.shmtu.edu.cn/...  │ ← content.js (IIFE)
│  ┌──────────────────────────┐  │
│  │  #captchaImg  #validateCode│  │
│  └──────────┬───────────────┘  │
│             │ ① 抓取位图 (canvas) │
│             │ ② 写入 #validateCode │
│             │                    │
│  ┌──────────▼───────────────┐    │
│  │  injected UI: 重新 OCR   │    │ ← MutationObserver 监听 src 变化
│  │  状态/算式/数据预览     │    │
│  └──────────┬───────────────┘    │
└─────────────┼────────────────────┘
              │ browser.runtime.sendMessage(OCR_RECOGNIZE)
              ▼
┌────────────────────────────────┐
│  background.js (Service Worker)│
│  ┌──────────────────────────┐  │
│  │  fetch(endpointUrl, ...) │  │
│  │  提取 captcha.text       │  │ → {ok, text, expression, endpointUrl, ...}
│  │  返回 content script     │  │
│  └──────────────────────────┘  │
└─────────────┬────────────────────┘
              │ POST {imageBase64}
              ▼
┌────────────────────────────────┐
│  OCR 服务 (可配置)             │
│  默认: http://127.0.0.1:21600 │
│  POST /api/ocr                │
└────────────────────────────────┘
```

## 消息流

1. **页面加载** — content script 在 `document_idle` 注入，检测到 `#captchaImg.complete && naturalWidth > 0` 后 250ms 触发首次 OCR
2. **用户换图** — `<img>.load` 事件（200ms）/ `<img>.click`（500ms）/ `<img>.src` 变化（MutationObserver，250ms）触发重 OCR
3. **手动重试** — 用户点击注入的"重新 OCR"按钮
4. **写表单** — 识别成功后写入 `#validateCode.value` 并派发 `input` + `change` 事件（确保 CAS 前端 SPA 同步）

## 进程边界

- **content script** 与 **CAS 页面** 共享 DOM，但 JavaScript 命名空间隔离
- **background (Service Worker)** 是无状态短生命周期，依赖 `browser.storage.local` 做持久化
- **popup** 是独立文档，仅在用户点击工具栏图标时打开
