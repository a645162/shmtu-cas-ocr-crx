# 架构总览

> 版本：0.1.0

## 目录结构

```
shmtu-cas-ocr-crx/
├── package.json                    # esbuild 依赖与脚本
├── build.mjs                       # esbuild 构建脚本
├── README.md                       # 极简安装说明
├── Documents/                      # 本文档（VitePress 站点）
│   ├── package.json                # vitepress 依赖与脚本
│   └── docs/
└── src/                            # 源码
    ├── manifest.json               # MV3 清单
    ├── background.js               # Service Worker (ESM)
    ├── content.js                  # 注入 CAS 登录页的 content script (IIFE)
    ├── popup.html                  # 设置面板入口
    ├── popup.js                    # 设置面板逻辑 (IIFE)
    └── popup.css                   # 设置面板样式
```

## 文件职责

| 组件 | 进程 | 模块格式 | 关键职责 |
| --- | --- | --- | --- |
| `content.js` | 页面注入 (CAS 域) | IIFE | 抓验证码位图、写表单、注入"重新 OCR / 状态 / 算式 / 预览" UI、监听 `<img>` 属性变化 |
| `background.js` | Service Worker | ESM | 接收消息 → 调 `fetch` 访问 OCR → 解析返回体 → 回包 |
| `popup.html/js/css` | 扩展弹窗 | IIFE | 设置 OCR 端点（持久化 `browser.storage.local`） |
| `manifest.json` | — | — | 注册 host_permissions / content_scripts / action / background |

## 子页面

- [运行时组件图](/runtime-components)
- [manifest.json 字段详解](/manifest)
