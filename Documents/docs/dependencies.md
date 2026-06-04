# 版本与依赖

> 版本：0.1.0

## 扩展版本

- 当前版本：`0.1.0`
- Manifest Version: **3**（MV3）

## 运行时依赖

| 依赖 | 用途 | 是否打包 |
| --- | --- | --- |
| `webextension-polyfill` | 跨浏览器 API 兼容 | 是 |
| 浏览器原生 `fetch` / `AbortController` | OCR 请求 + 超时 | — |
| 浏览器原生 `MutationObserver` | 监听 `<img>.src` 变化 | — |

## 构建依赖

| 依赖 | 用途 |
| --- | --- |
| `esbuild` | JS 打包（ESM / IIFE） |
| `webextension-polyfill` (dev) | 跨浏览器 API 兼容（仅类型） |

## License

MIT
