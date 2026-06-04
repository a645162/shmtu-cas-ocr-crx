# OCR_RECOGNIZE

> 版本：0.1.0

抓图 + 调 OCR 服务的核心流程。

## 请求

```js
{
  type: "OCR_RECOGNIZE",
  payload: { dataUrl: "data:image/png;base64,..." }
}
```

## 成功响应

```js
{
  ok: true,
  text: "42",                // 写入 #validateCode 的最终答案
  expression: "12+30=",      // 可选：算式原文 (用于 UI 展示)
  endpointUrl: "http://127.0.0.1:21600/api/ocr",
  status: 200,
  responseBody: { ... }      // 原始返回体，便于调试
}
```

## 失败响应

```js
{
  ok: false,
  error: "OCR 请求超时。",   // 用户可见的中文错误
  status: 0                  // 0 = 网络/超时/未发送
}
```

## 字段语义

| 字段 | 含义 |
| --- | --- |
| `text` | 由 `extractCaptchaText` 从多种后端返回结构中抽出的**最终答案**（`12+30=` → `"42"`） |
| `expression` | 可选：算式原文，用于注入 UI 展示 |
| `endpointUrl` | 实际命中的端点（可能是自动补全后的） |
| `status` | HTTP 状态码，0 表示未发出 / 网络 / 超时 |
| `responseBody` | 完整后端返回，方便调试 |
| `error` | 用户可见的错误描述 |
