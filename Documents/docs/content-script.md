# content.js 行为详解

> 版本：0.1.0

## 页面识别

```js
const PAGE_PREFIX = "https://cas.shmtu.edu.cn/cas/login";
function isTargetPage() { return window.location.href.startsWith(PAGE_PREFIX); }
```

仅在 `https://cas.shmtu.edu.cn/cas/login*` 路径下激活，其他页面直接 `return`。

## 抓图实现（关键点）

```js
function captchaToDataUrl(image) {
  if (!image.complete || image.naturalWidth === 0) {
    throw new Error("当前验证码图片尚未加载完成。");
  }
  const canvas = document.createElement("canvas");
  canvas.width  = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}
```

**故意不重新请求 `<img src>`** —— 直接读取当前 DOM 上已渲染的像素，避免触发服务端"换一张"机制。

## 自动识别触发时机

| 触发源 | 触发条件 | 延迟 |
| --- | --- | --- |
| 初次加载 | `image.complete && naturalWidth > 0` | 250 ms |
| `<img>.load` 事件 | 验证码图片换图后 | 200 ms |
| `<img>.click` 事件 | 用户点击验证码换图 | 500 ms |
| `<img>.src` 变化 | `MutationObserver` 监听 | 250 ms |
| 手动"重新 OCR" 按钮 | 用户点击 | 立即 |

**去重 / 防竞态**：`activeRunId` 计数器；旧 run 的响应到达时被忽略（避免旧的 OCR 结果覆盖新的验证码）。

## 注入的 UI 元素

| 元素 ID | 行为 |
| --- | --- |
| `shmtu-cas-ocr-retry-button` | "重新 OCR" 圆形按钮，识别中变为"识别中..."且 `disabled` |
| `shmtu-cas-ocr-status` | 状态文案（识别中 / 成功 / 错误），颜色随 `tone` 切换 |
| `shmtu-cas-ocr-expression` | "OCR算式：12+30=" 或 "等待识别" |
| `shmtu-cas-ocr-info-row` | 父容器，包含算式 / 状态 / 数据预览 / data URL 折叠 |
| `shmtu-cas-ocr-preview-image` | 实际发送的验证码位图（`data:image/png;base64,...`） |
| `shmtu-cas-ocr-payload-meta` | 头部 + 估算字节数（"数据头：data:image/png;base64, \| 估算字节：8421"） |
| `shmtu-cas-ocr-payload-text` | `<textarea readonly>` 完整 data URL，可复制排查 |

## 写表单

```js
function dispatchInputEvents(input) {
  input.dispatchEvent(new Event("input",  { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
```

写入 `input.value` 后**手动派发** `input` + `change` 事件，确保 CAS 页面的 Vue 响应式数据能同步更新（CAS 前端是 SPA，仅赋值不够）。
