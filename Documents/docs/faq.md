# 常见错误

> 版本：0.1.0

| 现象 | 原因 | 修复 |
| --- | --- | --- |
| "OCR 请求超时。" | OCR 服务未启动或端口被防火墙拦截 | `curl http://127.0.0.1:21600/api/ocr` 验证 |
| "OCR 服务返回 HTTP 404" | 端点路径不对 | 端点留空让插件自动补 `/api/ocr` |
| "OCR 服务没有返回可填写的识别结果。" | 后端返回结构不在 `extractCaptchaText` 识别范围 | 在 background DevTools 看 `responseBody` 原始结构 |
| 表单 value 改了但 CAS 不接收 | 没有派发 `input` 事件 | 已在 `dispatchInputEvents` 中处理；如仍无效请提 issue |
| 扩展页面 fetch 报 CSP 错误 | `connect-src` 缺少协议 | `manifest.json` 已显式声明 `http: https:` |
| 验证码图片未加载就调用 | `naturalWidth === 0` | 已在 `captchaToDataUrl` 中抛错，重 OCR 一次即可 |
| 旧 run 覆盖新图 | 多 run 并发，无去重 | 已有 `activeRunId` 机制；如仍出现请提 issue |
