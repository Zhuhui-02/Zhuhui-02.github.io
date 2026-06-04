# 轻小说翻译记忆工作台

一个可部署到 Cloudflare Pages 的静态翻译工作台，面向日本轻小说翻译：

- 支持 TXT、EPUB 导入，EPUB 会按 spine 顺序拆分章节。
- 支持 Kakuyomu、Syosetu/Narou、小説家になろう、Hameln、Novelup+、Alphapolis 等在线连载网页读取，由 Cloudflare Pages Function 代服务器抓取页面。
- 调用 Mimo OpenAI 兼容 API 翻译文本，默认使用 `mimo-v2.5-pro`。
- 翻译时自动维护术语表、时空表格、角色特征表格、角色与主角社交表格、任务/命令/约定表格、重要事件历史表格、重要物品表格。
- 提供原文/译文即时预览，并可下载 TXT、HTML、项目 JSON、记忆表 JSON。

## Cloudflare Pages

项目无需构建步骤：

- Build command 留空
- Build output directory 填 `.`
- Functions 会自动读取 `functions/api/translate.js` 和 `functions/api/source.js`

API 地址和模型已经在服务端固定。请在 Cloudflare Pages 环境变量里配置密钥，不要把密钥提交到 public 仓库：

- `MIMO_API_KEY`
- 可选：`MIMO_MODEL`，默认 `mimo-v2.5-pro`
- 可选：`MIMO_BASE_URL`，默认 `https://token-plan-cn.xiaomimimo.com/v1`

默认接口协议为 OpenAI Chat Completions 兼容格式：`POST /chat/completions`。

## 本地预览

纯前端界面可以直接打开 `index.html`。如果要测试 Cloudflare Pages Functions，请用 Wrangler 或 Cloudflare Pages 的本地开发环境运行。
