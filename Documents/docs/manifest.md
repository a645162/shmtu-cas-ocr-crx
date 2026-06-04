# manifest.json 字段详解

> 版本：0.1.0

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

详见 [host_permissions 与 CSP](/host-permissions)。
