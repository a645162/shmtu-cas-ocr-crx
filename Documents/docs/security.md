# 安全与隐私

> 版本：0.1.0

- 扩展**仅**匹配 `https://cas.shmtu.edu.cn/cas/login*` 域名，不向其他域注入脚本
- 唯一权限为 `storage`（保存端点）；host_permissions 显式列出 CAS 与任意 HTTP(S)（**仅供 OCR 调用**，由 manifest CSP 强制限制 `connect-src`）
- 不收集任何 cookie / 表单数据；表单仅在当前用户页面**就地**写入 `#validateCode`
- OCR 服务的选择完全由用户控制；点击"默认值"可一键回退到 `127.0.0.1` 本地服务
- 所有 `sendMessage` 通信都限制在 `runtime` 通道，不暴露到外部网络

## 建议

- 如对扩展安全存疑，可在 DevTools → Application → Service Workers 查看 background 的全部网络请求
- 如需完全离线使用，请部署本地 `Server/shmtu-cas-ocr-server`（CPU/Vulkan Docker 镜像可选）
