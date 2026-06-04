# 安装与运行

> 版本：0.1.0 | 更新日期：2026-06-04

## 系统要求

- Chrome / Edge / Brave 等 Chromium 内核浏览器，**Manifest V3** 支持版本（Chrome 120+ 推荐）
- 可访问的 **OCR 服务**（参见 `Server/shmtu-cas-ocr-server`，默认 `http://127.0.0.1:21600/api/ocr`）

## 在 Chrome 中加载已解压扩展

1. 打开 `chrome://extensions/`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择本仓库 `Plugin/shmtu-cas-ocr-crx/dist/` 目录

> 若 `dist/` 不存在或需要重新构建，请按 § 源码构建。

## 源码构建

```bash
cd Plugin/shmtu-cas-ocr-crx
npm install
npm run build         # 产物输出到 dist/
npm run clean         # 清理 dist/
```

构建流程由 `build.mjs` 编排：使用 esbuild 把 `src/{background,content,popup}.js` 分别打包为 ESM / IIFE，并把 `manifest.json` / `popup.html` / `popup.css` 原样拷贝到 `dist/`。

## 首次配置 OCR 端点

点击浏览器工具栏扩展图标，在弹窗中：

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `OCR 服务地址` | `http://127.0.0.1:21600/api/ocr` | 留空回退到默认；若只填主机+端口（如 `http://127.0.0.1:21600`），自动补全为 `/api/ocr` |

设置持久化在 `browser.storage.local` 中，键名 `ocrSettings`，仅含 `endpointUrl` 字段。
