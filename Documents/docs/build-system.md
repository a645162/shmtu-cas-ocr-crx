# esbuild 构建系统

> 版本：0.1.0

`build.mjs` 使用 **esbuild** 一次性并行打包三个 JS + 复制三个静态文件。

## 入口与输出

| 入口 | 输出 | 模块格式 | 目标 |
| --- | --- | --- | --- |
| `src/background.js` | `dist/background.js` | `esm` | chrome120 |
| `src/content.js` | `dist/content.js` | `iife` | chrome120 |
| `src/popup.js` | `dist/popup.js` | `iife` | chrome120 |
| `src/manifest.json` | `dist/manifest.json` | — | — |
| `src/popup.html` | `dist/popup.html` | — | — |
| `src/popup.css` | `dist/popup.css` | — | — |

## 流程

```js
await Promise.all([
  esbuild.build({ entryPoints: ["src/background.js"], outfile: "dist/background.js", format: "esm", target: "chrome120" }),
  esbuild.build({ entryPoints: ["src/content.js"],    outfile: "dist/content.js",    format: "iife", target: "chrome120" }),
  esbuild.build({ entryPoints: ["src/popup.js"],      outfile: "dist/popup.js",      format: "iife", target: "chrome120" }),
  fs.copyFile("src/manifest.json", "dist/manifest.json"),
  fs.copyFile("src/popup.html",    "dist/popup.html"),
  fs.copyFile("src/popup.css",     "dist/popup.css"),
]);
```

`Promise.all` 包裹所有任务；任一失败 `process.exitCode = 1`。

## 命令

```bash
npm run build         # 产物输出到 dist/
npm run clean         # 清理 dist/
```
