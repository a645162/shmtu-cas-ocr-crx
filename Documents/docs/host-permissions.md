# host_permissions 与 CSP

> 版本：0.1.0

## host_permissions

```json
"host_permissions": [
  "https://cas.shmtu.edu.cn/*",
  "http://*/*",
  "https://*/*"
]
```

- `https://cas.shmtu.edu.cn/*` —— content script 注入的**精确**目标域
- `http://*/*` / `https://*/*` —— 显式声明**任意** HTTP(S) 端点，使 background 的 `fetch` 能 POST 到本地 OCR 服务（默认 `127.0.0.1:21600`）

> **最小权限原则** vs **可用性** —— 这里我们权衡了可用性：本地 OCR 可能跑在 `127.0.0.1` / 局域网 IP / 自托管域名，扩展必须能在不修改 manifest 的前提下访问。

## content_security_policy

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; connect-src http: https:;"
}
```

- `script-src 'self'` —— 扩展页面只允许执行打包后的本地脚本（符合 MV3 默认）
- `object-src 'self'` —— 禁止内嵌对象
- `connect-src http: https:` —— **关键**：允许扩展页面向 `http(s):` 端点发请求，否则 `fetch('http://127.0.0.1:...')` 会被 CSP 拒绝

## 验证

打开 DevTools（扩展页 / Service Worker）查看 Network 面板：

- 成功 → 请求 status 2xx / 4xx，但能正常发出
- 失败 → DevTools Console 报 `Refused to connect to 'http://...' because it violates the following Content Security Policy directive`
