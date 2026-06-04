# 调试与排错

> 版本：0.1.0

## 查看 Service Worker 日志

`chrome://extensions/` → 找到 "SHMTU CAS OCR" → 点击 "Service Worker" 蓝色链接 → DevTools 打开。

## 查看 content script 日志

打开 CAS 登录页 → F12 → Console，过滤 `[shmtu-cas-ocr-crx]` 前缀。

## 自带数据预览

页面右下角注入的"查看发送的 data URL" textarea 直接展示真实发送的 base64，可与 OCR 服务端日志对比。

## 网络面板验证

- 成功 → 状态 200 / 4xx，请求体是 `{"imageBase64": "..."}`
- CSP 失败 → DevTools Console 报 "Refused to connect to ..."
- 跨域失败 → 状态 `(failed) net::ERR_*`

## 临时禁用扩展

在 `chrome://extensions/` 关闭扩展，验证"是不是扩展引起"。

## 重载扩展

修改源码后：

```bash
npm run build
```

回到 `chrome://extensions/` 点击 🔄 重新加载扩展。
