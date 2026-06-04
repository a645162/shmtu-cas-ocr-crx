# shmtu-cas-ocr-crx — 浏览器扩展参考手册

> 版本：0.1.0 | 更新日期：2026-06-04
>
> Chrome Manifest V3 扩展，专为 [SHMTU CAS 登录页](https://cas.shmtu.edu.cn/cas/login) 提供**验证码 OCR 自动识别 + 自动填表**能力。

---

## 〇、定位

`shmtu-cas-ocr-crx` 是 `shmtu-terminal` 聚合生态中面向**浏览器场景**的最小依赖 OCR 自动化组件，与以下三个层级形成对照：

| 客户端类型 | 验证码方案 | 自动填表 | 代表项目 |
| --- | --- | --- | --- |
| 桌面应用 (Tauri / Avalonia) | 手动 / 远程 OCR / 本地 ONNX | 是 | `shmtu-terminal-tauri` / `shmtu-terminal-desktop` |
| Android 原生 | 手动 / 远程 OCR / 本地 ONNX | 是 | `shmtu-terminal-android` |
| **浏览器扩展（本插件）** | **远程 OCR** | **是** | `shmtu-cas-ocr-crx` |

OCR 模型推理统一在**远端服务**完成，扩展本体只做三件事：

1. 从 CAS 登录页 `<img id="captchaImg">` 抓取当前验证码位图（直接读 `canvas.toDataURL`，**不重新请求**，避免刷新验证码）。
2. 把 PNG data URL POST 到可配置的 OCR 端点。
3. 把识别结果写回 `<input id="validateCode">`，并触发 `input` / `change` 事件。

---

## 一、安装与运行

### 1.1 系统要求

- Chrome / Edge / Brave 等 Chromium 内核浏览器，**Manifest V3** 支持版本（Chrome 120+ 推荐）
- 可访问的 **OCR 服务**（参见 `Server/shmtu-cas-ocr-server`，默认 `http://127.0.0.1:21600/api/ocr`）

### 1.2 在 Chrome 中加载已解压扩展

1. 打开 `chrome://extensions/`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择本仓库 `Plugin/shmtu-cas-ocr-crx/dist/` 目录

> 若 `dist/` 不存在或需要重新构建，请按 § 1.3。

### 1.3 源码构建

```bash
cd Plugin/shmtu-cas-ocr-crx
npm install
npm run build         # 产物输出到 dist/
npm run clean         # 清理 dist/
```

构建流程由 `build.mjs` 编排：使用 esbuild 把 `src/{background,content,popup}.js` 分别打包为 ESM / IIFE，并把 `manifest.json` / `popup.html` / `popup.css` 原样拷贝到 `dist/`。

### 1.4 首次配置 OCR 端点

点击浏览器工具栏扩展图标，在弹窗中：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `OCR 服务地址` | `http://127.0.0.1:21600/api/ocr` | 留空回退到默认；若只填主机+端口（如 `http://127.0.0.1:21600`），自动补全为 `/api/ocr` |

设置持久化在 `browser.storage.local` 中，键名 `ocrSettings`，仅含 `endpointUrl` 字段。

---

## 二、架构与文件清单

### 2.1 目录结构

```
shmtu-cas-ocr-crx/
├── package.json                    # 依赖与脚本
├── build.mjs                       # esbuild 构建脚本
├── README.md                       # 极简安装说明
├── Documents/
│   └── REFERENCE.md                # 本文档
├── src/                            # 源码
│   ├── manifest.json               # MV3 清单
│   ├── background.js               # Service Worker (ESM)
│   ├── content.js                  # 注入 CAS 登录页的 content script (IIFE)
│   ├── popup.html                  # 设置面板入口
│   ├── popup.js                    # 设置面板逻辑 (IIFE)
│   └── popup.css                   # 设置面板样式
└── dist/                           # 打包产物 (npm run build 产生)
    ├── manifest.json
    ├── background.js
    ├── content.js
    ├── popup.html
    ├── popup.js
    └── popup.css
```

### 2.2 运行时组件图

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
└─────────────┬──────────────────┘
              │ POST {imageBase64}
              ▼
┌────────────────────────────────┐
│  OCR 服务 (可配置)             │
│  默认: http://127.0.0.1:21600 │
│  POST /api/ocr                │
└────────────────────────────────┘
```

### 2.3 角色分工

| 组件 | 进程 | 模块格式 | 关键职责 |
| --- | --- | --- | --- |
| `content.js` | 页面注入 (CAS 域) | IIFE | 抓验证码位图、写表单、注入"重新 OCR / 状态 / 算式 / 预览" UI、监听 `<img>` 属性变化 |
| `background.js` | Service Worker | ESM | 接收消息 → 调 `fetch` 访问 OCR → 解析返回体 → 回包 |
| `popup.html/js/css` | 扩展弹窗 | IIFE | 设置 OCR 端点（持久化 `browser.storage.local`） |
| `manifest.json` | — | — | 注册 host_permissions / content_scripts / action / background |

---

## 三、配置文件（`manifest.json`）详解

```json
{
  "manifest_version": 3,
  "name": "SHMTU CAS OCR",
  "version": "0.1.0",
  "permissions": ["storage"],
  "host_permissions": [
    "https://cas.shmtu.edu.cn/*",
    "http://*/*",
    "https://*/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "action": {
    "default_title": "SHMTU CAS OCR",
    "default_popup": "popup.html"
  },
  "content_scripts": [
    {
      "matches": ["https://cas.shmtu.edu.cn/cas/login*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; connect-src http: https:;"
  }
}
```

| 字段 | 含义 | 备注 |
| --- | --- | --- |
| `permissions: ["storage"]` | 使用 `browser.storage.local` 保存端点 | 最小权限原则 |
| `host_permissions: https://cas.shmtu.edu.cn/*` | 注入到 CAS 登录页 | content script 匹配域 |
| `host_permissions: http://*/*, https://*/*` | 任意 HTTP(S) 端点 | **显式声明**才能 POST 到本地 OCR |
| `background.type: "module"` | 允许 ES Module 语法 | 与 esbuild 输出 `format: "esm"` 对应 |
| `content_scripts.run_at: "document_idle"` | DOM 就绪后注入 | 等待 CAS 表单渲染 |
| `content_security_policy.connect-src http: https:` | 允许扩展页面向 http(s) 端点发请求 | MV3 默认禁明文，需显式声明 |

---

## 四、内部协议

扩展内部使用 `browser.runtime.sendMessage` 通信，三种消息类型：

### 4.1 `GET_SETTINGS`

读取 OCR 端点。

**请求**：

```js
{ type: "GET_SETTINGS" }
```

**响应**：

```js
{ endpointUrl: "http://127.0.0.1:21600/api/ocr" }
```

### 4.2 `SAVE_SETTINGS`

保存 OCR 端点（严格校验）。

**请求**：

```js
{
  type: "SAVE_SETTINGS",
  payload: { endpointUrl: "http://127.0.0.1:21600" }
}
```

**响应**：

```js
{ endpointUrl: "http://127.0.0.1:21600/api/ocr" }   // 路径被自动补全
```

**失败**：URL 非法或协议非 `http(s)` 时 `throw` 异常，弹窗显示错误信息。

### 4.3 `OCR_RECOGNIZE`

抓图 + 调 OCR 服务的核心流程。

**请求**：

```js
{
  type: "OCR_RECOGNIZE",
  payload: { dataUrl: "data:image/png;base64,..." }
}
```

**成功响应**：

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

**失败响应**：

```js
{
  ok: false,
  error: "OCR 请求超时。",   // 用户可见的中文错误
  status: 0                  // 0 = 网络/超时/未发送
}
```

---

## 五、Content Script 行为详解

### 5.1 页面识别

```js
const PAGE_PREFIX = "https://cas.shmtu.edu.cn/cas/login";
function isTargetPage() { return window.location.href.startsWith(PAGE_PREFIX); }
```

仅在 `https://cas.shmtu.edu.cn/cas/login*` 路径下激活，其他页面直接 `return`。

### 5.2 抓图实现（关键点）

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

**故意不重新请求 `<img src>`**——直接读取当前 DOM 上已渲染的像素，避免触发服务端"换一张"机制。

### 5.3 自动识别触发时机

| 触发源 | 触发条件 | 延迟 |
| --- | --- | --- |
| 初次加载 | `image.complete && naturalWidth > 0` | 250 ms |
| `<img>.load` 事件 | 验证码图片换图后 | 200 ms |
| `<img>.click` 事件 | 用户点击验证码换图 | 500 ms |
| `<img>.src` 变化 | `MutationObserver` 监听 | 250 ms |
| 手动"重新 OCR" 按钮 | 用户点击 | 立即 |

**去重 / 防竞态**：`activeRunId` 计数器；旧 run 的响应到达时被忽略（避免旧的 OCR 结果覆盖新的验证码）。

### 5.4 注入的 UI 元素

| 元素 ID | 行为 |
| --- | --- |
| `shmtu-cas-ocr-retry-button` | "重新 OCR" 圆形按钮，识别中变为"识别中..."且 `disabled` |
| `shmtu-cas-ocr-status` | 状态文案（识别中 / 成功 / 错误），颜色随 `tone` 切换 |
| `shmtu-cas-ocr-expression` | "OCR算式：12+30=" 或 "等待识别" |
| `shmtu-cas-ocr-info-row` | 父容器，包含算式 / 状态 / 数据预览 / data URL 折叠 |
| `shmtu-cas-ocr-preview-image` | 实际发送的验证码位图（`data:image/png;base64,...`） |
| `shmtu-cas-ocr-payload-meta` | 头部 + 估算字节数（"数据头：data:image/png;base64, \| 估算字节：8421"） |
| `shmtu-cas-ocr-payload-text` | `<textarea readonly>` 完整 data URL，可复制排查 |

### 5.5 写表单

```js
function dispatchInputEvents(input) {
  input.dispatchEvent(new Event("input",  { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
```

写入 `input.value` 后**手动派发** `input` + `change` 事件，确保 CAS 页面的 Vue 响应式数据能同步更新（CAS 前端是 SPA，仅赋值不够）。

---

## 六、Background Service Worker 详解

### 6.1 端点规范化

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

### 6.2 响应文本提取

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

### 6.3 请求超时

```js
const REQUEST_TIMEOUT_MS = 8000;
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
```

8 秒未响应视为失败，错误信息为 "OCR 请求超时。"。

### 6.4 错误归一化

| 错误源 | 返回 `error` |
| --- | --- |
| `data:` URL 缺失 | "页面没有提供可用的验证码图片数据。" |
| base64 缺失 | "验证码图片 data URL 缺少 base64 数据。" |
| HTTP 非 2xx | `responseBody?.error \|\| "OCR 服务返回 HTTP {status}。"` |
| 后端 `success: false` | `responseBody?.error \|\| "OCR 服务返回失败。"` |
| 无可填结果 | `responseBody?.error \|\| "OCR 服务没有返回可填写的识别结果。"` |
| `AbortError` | "OCR 请求超时。" |
| 其他 `fetch` 异常 | `"OCR 请求失败：{message}"` |

### 6.5 生命周期

```js
browser.runtime.onInstalled.addListener(async () => {
  // 首次安装写入默认设置；已有设置则重新 normalize 一次
});

browser.runtime.onMessage.addListener((message) => {
  // 分发 GET_SETTINGS / SAVE_SETTINGS / OCR_RECOGNIZE
});
```

MV3 Service Worker 会被浏览器随时销毁/唤醒，所以**所有状态都依赖 `browser.storage.local`**，不依赖内存变量。

---

## 七、Popup 弹窗详解

### 7.1 文件组成

| 文件 | 作用 |
| --- | --- |
| `popup.html` | 表单结构（端点输入框 / 保存 / 默认值按钮 / 状态文本） |
| `popup.js` | 加载/保存逻辑（`form.addEventListener("submit", ...)`） |
| `popup.css` | 样式（居中卡片、按钮、错误色 `#b42318`、成功色 `#0b67b0`） |

### 7.2 交互

1. 打开弹窗 → `loadSettings()` → 通过 `GET_SETTINGS` 读当前端点 → 填入输入框。
2. 用户修改输入 → 点击 "保存" → 弹 `SAVE_SETTINGS` → 后端严格校验 → 回显规范化后的端点。
3. 点击 "默认值" → 输入框回填 `http://127.0.0.1:21600/api/ocr`（**仅填入，不保存**）。
4. 底部 `status-text` 实时显示："读取配置失败，已回退到默认值" / "OCR 服务地址已保存" / "默认地址已填入，点击保存即可生效"。

### 7.3 状态颜色

| 状态 | 颜色 |
| --- | --- |
| 错误 (`isError = true`) | `#b42318` (深红) |
| 正常 / 成功 | `#0b67b0` (深蓝) |

---

## 八、构建系统（`build.mjs`）

使用 **esbuild** 一次性并行打包三个 JS + 复制三个静态文件：

| 入口 | 输出 | 模块格式 | 目标 |
| --- | --- | --- | --- |
| `src/background.js` | `dist/background.js` | `esm` | chrome120 |
| `src/content.js` | `dist/content.js` | `iife` | chrome120 |
| `src/popup.js` | `dist/popup.js` | `iife` | chrome120 |
| `src/manifest.json` | `dist/manifest.json` | — | — |
| `src/popup.html` | `dist/popup.html` | — | — |
| `src/popup.css` | `dist/popup.css` | — | — |

`Promise.all` 包裹所有任务；任一失败 `process.exitCode = 1`。

---

## 九、调试与排错

### 9.1 查看 Service Worker 日志

`chrome://extensions/` → 找到 "SHMTU CAS OCR" → 点击 "Service Worker" 蓝色链接 → DevTools 打开。

### 9.2 查看 content script 日志

打开 CAS 登录页 → F12 → Console，过滤 `[shmtu-cas-ocr-crx]` 前缀。

### 9.3 自带数据预览

页面右下角注入的"查看发送的 data URL" textarea 直接展示真实发送的 base64，可与 OCR 服务端日志对比。

### 9.4 常见错误

| 现象 | 原因 | 修复 |
| --- | --- | --- |
| "OCR 请求超时。" | OCR 服务未启动或端口被防火墙拦截 | `curl http://127.0.0.1:21600/api/ocr` 验证 |
| "OCR 服务返回 HTTP 404" | 端点路径不对 | 端点留空让插件自动补 `/api/ocr` |
| "OCR 服务没有返回可填写的识别结果。" | 后端返回结构不在 `extractCaptchaText` 识别范围 | 在 background DevTools 看 `responseBody` 原始结构 |
| 表单 value 改了但 CAS 不接收 | 没有派发 `input` 事件 | 已在 `dispatchInputEvents` 中处理；如仍无效请提 issue |
| 扩展页面 fetch 报 CSP 错误 | `connect-src` 缺少协议 | `manifest.json` 已显式声明 `http: https:` |

---

## 十、跨模块协作

```
shmtu-cas-ocr-crx (浏览器)
        │  POST {imageBase64}
        ▼
Server/shmtu-cas-ocr-server (C++, ncnn, 默认 21600)
        │
        ▼
Model/shmtu-cas-ocr-model (ONNX / NCNN 模型权重)
```

- **服务端**：`Server/shmtu-cas-ocr-server`（CPU/Vulkan 两套镜像），对外暴露 `POST /api/ocr`，body 为 `{"imageBase64": "..."}`，response 含 `result` / `text` / `expression` 等字段（插件兼容多字段名）。
- **模型**：`Model/shmtu-cas-ocr-model` 提供 3 个模型：算子 (`operator`)、等号 (`equal_symbol`)、数字 (`digit`)，共同识别 `1+2=` 类算式验证码。

---

## 十一、安全与隐私

- 扩展**仅**匹配 `https://cas.shmtu.edu.cn/cas/login*` 域名，不向其他域注入脚本。
- 唯一权限为 `storage`（保存端点）；host_permissions 显式列出 CAS 与任意 HTTP(S)（**仅供 OCR 调用**，由 manifest CSP 强制限制 `connect-src`）。
- 不收集任何 cookie / 表单数据；表单仅在当前用户页面**就地**写入 `#validateCode`。
- OCR 服务的选择完全由用户控制；点击"默认值"可一键回退到 `127.0.0.1` 本地服务。

---

## 十二、版本与 License

- 当前版本：`0.1.0`
- License：MIT
- 依赖：`esbuild` (dev), `webextension-polyfill` (runtime)
