# background.js Service Worker

> 版本：0.1.0

## 端点规范化

```js
function normalizeEndpointUrl(value, strict = false) {
  const candidate = (typeof value === "string" ? value.trim() : "") || DEFAULT_SETTINGS.endpointUrl;
  let url;
  try { url = new URL(candidate); }
  catch (e) { /* 严格模式抛错；非严格回退默认 */ }
  if (url.protocol !== "http:" && url.protocol !== "https:") { /* 同上 */ }
  if (url.pathname === "" || url.pathname === "/") url.pathname = "/api/ocr";
  return url.toString();
}
```

| 行为 | 触发 |
| --- | --- |
| 自动补全 `/api/ocr` | 路径为 `""` 或 `"/"` |
| 自动改写 `/api/ocr/upload` → `/api/ocr` | 兼容老式后端 |
| 严格模式抛错 | 协议非 `http(s)`、URL 不合法（仅在 `SAVE_SETTINGS` 时） |

## 响应文本提取

```js
function extractCaptchaText(payload) {
  const candidates = [
    payload?.result, payload?.text, payload?.code, payload?.captcha,
    payload?.prediction, payload?.value,
    payload?.data?.result, payload?.data?.text, payload?.data?.code
  ];
  // 找到第一个非空字符串 / 有限数字
  // 兜底: expression.split("=").at(-1)
}
```

兼容多种 OCR 后端返回结构（不同的 `shmtu-cas-ocr-server` 变体 / 第三方 OCR），并兜底从算式 `12+30=` 中取右侧。

## 请求超时

```js
const REQUEST_TIMEOUT_MS = 8000;
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
```

8 秒未响应视为失败，错误信息为 "OCR 请求超时。"。

## 错误归一化

| 错误源 | 返回 `error` |
| --- | --- |
| `data:` URL 缺失 | "页面没有提供可用的验证码图片数据。" |
| base64 缺失 | "验证码图片 data URL 缺少 base64 数据。" |
| HTTP 非 2xx | `responseBody?.error \|\| "OCR 服务返回 HTTP {status}。"` |
| 后端 `success: false` | `responseBody?.error \|\| "OCR 服务返回失败。"` |
| 无可填结果 | `responseBody?.error \|\| "OCR 服务没有返回可填写的识别结果。"` |
| `AbortError` | "OCR 请求超时。" |
| 其他 `fetch` 异常 | `"OCR 请求失败：{message}"` |

## 生命周期

```js
browser.runtime.onInstalled.addListener(async () => {
  // 首次安装写入默认设置；已有设置则重新 normalize 一次
});

browser.runtime.onMessage.addListener((message) => {
  // 分发 GET_SETTINGS / SAVE_SETTINGS / OCR_RECOGNIZE
});
```

MV3 Service Worker 会被浏览器随时销毁/唤醒，所以**所有状态都依赖 `browser.storage.local`**，不依赖内存变量。
