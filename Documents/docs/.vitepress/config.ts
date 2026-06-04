import { defineConfig } from 'vitepress'

function resolveBase() {
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
  if (!process.env.GITHUB_ACTIONS || !repo) {
    return '/'
  }
  return repo.endsWith('.github.io') ? '/' : `/${repo}/`
}

export default defineConfig({
  base: resolveBase(),
  lang: 'zh-CN',
  title: 'shmtu-cas-ocr-crx 浏览器扩展',
  description: 'SHMTU CAS 登录页验证码 OCR 自动识别 + 自动填表浏览器扩展',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,
  themeConfig: {
    nav: [
      { text: '概览', link: '/' },
      { text: '安装', link: '/install' },
      { text: '架构', link: '/architecture' },
      { text: '配置', link: '/configuration' },
    ],
    sidebar: [
      {
        text: '概览',
        items: [
          { text: '文档首页', link: '/' },
          { text: '安装与运行', link: '/install' },
          { text: '架构总览', link: '/architecture' },
          { text: '运行时组件图', link: '/runtime-components' },
        ],
      },
      {
        text: 'manifest.json',
        items: [
          { text: '字段详解', link: '/manifest' },
          { text: 'host_permissions 与 CSP', link: '/host-permissions' },
        ],
      },
      {
        text: '内部协议',
        items: [
          { text: 'GET_SETTINGS', link: '/protocol/get-settings' },
          { text: 'SAVE_SETTINGS', link: '/protocol/save-settings' },
          { text: 'OCR_RECOGNIZE', link: '/protocol/ocr-recognize' },
        ],
      },
      {
        text: '源码解析',
        items: [
          { text: 'content.js 行为', link: '/content-script' },
          { text: 'background.js 服务', link: '/background' },
          { text: 'popup 弹窗', link: '/popup' },
        ],
      },
      {
        text: '构建与发布',
        items: [
          { text: 'esbuild 构建系统', link: '/build-system' },
          { text: '调试与排错', link: '/debugging' },
          { text: '常见错误', link: '/faq' },
        ],
      },
      {
        text: '附录',
        items: [
          { text: '跨模块协作', link: '/cross-module' },
          { text: '安全与隐私', link: '/security' },
          { text: '版本与依赖', link: '/dependencies' },
        ],
      },
    ],
    outline: [2, 3],
    search: {
      provider: 'local',
    },
    footer: {
      message: 'shmtu-cas-ocr-crx Extension Docs',
      copyright: 'Copyright © shmtu-cas-ocr-crx',
    },
  },
})
