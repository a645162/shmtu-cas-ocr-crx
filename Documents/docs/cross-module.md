# 跨模块协作

> 版本：0.1.0

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

## 桌面端对照

| 客户端 | 验证码识别方式 | 文档 |
| --- | --- | --- |
| 桌面 (Tauri) | 手动 / 远程 OCR / 本地 ONNX | `shmtu-terminal-tauri/Documents/docs` |
| 桌面 (.NET) | 手动 / 远程 OCR / 本地 ONNX | `shmtu-terminal-desktop/Documents/docs` |
| Android | 手动 / 远程 OCR / 本地 ONNX | `shmtu-terminal-android/Documents/docs` |
| **浏览器扩展（本插件）** | **仅远程 OCR** | `Plugin/shmtu-cas-ocr-crx/Documents/docs` |
