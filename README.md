# shmtu-cas-ocr-crx

Chrome Manifest V3 插件。

功能：

- 命中 `https://cas.shmtu.edu.cn/cas/login*` 页面时，读取 `#captchaImg`
- 将当前验证码图片发送到 OCR 服务
- 把识别结果自动填入 `#validateCode`
- 点击插件图标后弹出小面板，可配置 OCR 服务地址
- 显式支持 `http://` OCR 服务

默认 OCR 接口地址：

```text
http://127.0.0.1:21600/api/ocr
```

如果弹窗里只填写主机和端口，例如：

```text
http://127.0.0.1:21600
```

插件会自动补全成 `/api/ocr`。

## 开发

```bash
npm install
npm run build
```

构建结果输出到 `dist/`。

## 安装

1. 打开 Chrome 的扩展程序页面
2. 开启开发者模式
3. 选择“加载已解压的扩展程序”
4. 载入当前目录下的 `dist/`
