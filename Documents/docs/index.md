---
layout: home

hero:
  name: shmtu-cas-ocr-crx
  text: 浏览器扩展参考
  tagline: SHMTU CAS 登录页验证码 OCR 自动识别 + 自动填表
  actions:
    - theme: brand
      text: 快速安装
      link: /install
    - theme: alt
      text: 架构总览
      link: /architecture
    - theme: alt
      text: 内部协议
      link: /protocol/ocr-recognize
    - theme: alt
      text: 调试排错
      link: /debugging

features:
  - title: CAS 登录页注入
    details: 自动识别 https://cas.shmtu.edu.cn/cas/login 页面，DOM 就绪后挂载 UI
  - title: 远程 OCR 识别
    details: 抓 canvas 位图 → POST 到可配置 OCR 端点 → 写回 #validateCode 并派发 input/change
  - title: Manifest V3
    details: Service Worker (ESM) + content script (IIFE)，最低权限：仅 storage
  - title: 自调试面板
    details: 注入"重新 OCR / 状态 / 算式 / 预览 / data URL"UI，0 步打开 DevTools 就能看请求细节
---

## 这是什么

`shmtu-cas-ocr-crx` 是 `shmtu-terminal` 聚合生态中面向**浏览器场景**的最小依赖 OCR 自动化组件。

| 客户端类型 | 验证码方案 | 自动填表 | 代表项目 |
| --- | --- | --- | --- |
| 桌面应用 (Tauri / Avalonia) | 手动 / 远程 OCR / 本地 ONNX | 是 | `shmtu-terminal-tauri` / `shmtu-terminal-desktop` |
| Android 原生 | 手动 / 远程 OCR / 本地 ONNX | 是 | `shmtu-terminal-android` |
| **浏览器扩展（本插件）** | **远程 OCR** | **是** | `shmtu-cas-ocr-crx` |

OCR 模型推理统一在**远端服务**完成，扩展本体只做三件事：

1. 从 CAS 登录页 `<img id="captchaImg">` 抓取当前验证码位图（直接读 `canvas.toDataURL`，**不重新请求**）
2. 把 PNG data URL POST 到可配置的 OCR 端点
3. 把识别结果写回 `<input id="validateCode">`，并触发 `input` / `change` 事件

## 下一步

- [安装与运行](/install)
- [架构总览](/architecture)
- [manifest.json 字段详解](/manifest)
