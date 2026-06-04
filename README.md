# 轻小说翻译记忆工作台

一个可部署到 Cloudflare Pages 的静态翻译工作台，面向日本轻小说翻译：

- 支持 TXT、EPUB 导入，EPUB 会按 spine 顺序拆分章节。
- 支持 Kakuyomu URL 读取，由 Cloudflare Pages Function 代服务器抓取页面。
- 调用你提供的 OpenAI 兼容 API 翻译文本。
- 翻译时自动维护术语表、时空表格、角色特征表格、角色与主角社交表格、任务/命令/约定表格、重要事件历史表格、重要物品表格。
- 提供原文/译文即时预览，并可下载 TXT、HTML、项目 JSON、记忆表 JSON。

## Cloudflare Pages

项目无需构建步骤：

- Build command 留空
- Build output directory 填 `.`
- Functions 会自动读取 `functions/api/translate.js` 和 `functions/api/kakuyomu.js`

可以在页面里临时填写 API Key，也可以在 Cloudflare Pages 环境变量里配置：

- `TRANSLATION_API_KEY` 或 `OPENAI_API_KEY`
- `TRANSLATION_MODEL` 或 `AI_MODEL`
- 可选：`TRANSLATION_BASE_URL` 或 `OPENAI_BASE_URL`

默认接口协议为 OpenAI Chat Completions 兼容格式：`POST /chat/completions`。

## 本地预览

纯前端界面可以直接打开 `index.html`。如果要测试 Cloudflare Pages Functions，请用 Wrangler 或 Cloudflare Pages 的本地开发环境运行。
