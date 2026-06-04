# SAVE_SETTINGS

> 版本：0.1.0

保存 OCR 端点（严格校验）。

## 请求

```js
{
  type: "SAVE_SETTINGS",
  payload: { endpointUrl: "http://127.0.0.1:21600" }
}
```

## 响应

```js
{ endpointUrl: "http://127.0.0.1:21600/api/ocr" }   // 路径被自动补全
```

## 校验

`background.js::normalizeEndpointUrl(value, strict = true)`：

1. 空字符串 / 非字符串 → 使用 `DEFAULT_SETTINGS.endpointUrl`（严格模式下抛错）
2. `new URL(candidate)` 失败 → 严格模式抛错
3. `protocol` 不是 `http:` / `https:` → 严格模式抛错
4. `pathname` 为 `""` 或 `"/"` → 自动补 `/api/ocr`
5. `pathname` 为 `/api/ocr/upload` → 改写为 `/api/ocr`（兼容老式后端）

## 失败

- URL 非法 / 协议非 http(s) → `throw`，弹窗显示错误信息
- `browser.storage.local.set` 失败 → 抛错，弹窗显示错误信息
