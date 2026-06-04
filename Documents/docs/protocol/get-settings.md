# GET_SETTINGS

> 版本：0.1.0

读取 OCR 端点。

## 请求

```js
{ type: "GET_SETTINGS" }
```

## 响应

```js
{ endpointUrl: "http://127.0.0.1:21600/api/ocr" }
```

## 失败处理

- `endpointUrl` 不存在 → 回退到 `DEFAULT_SETTINGS.endpointUrl`（`http://127.0.0.1:21600/api/ocr`）
- `browser.storage.local` 不可用 → popup 显示"读取配置失败，已回退到默认值"

## 调用栈

```
popup.js (loadSettings)
  → browser.runtime.sendMessage({ type: "GET_SETTINGS" })
  → background.js (onMessage 分发)
  → browser.storage.local.get("ocrSettings")
  → 返回给 content script / popup
```
