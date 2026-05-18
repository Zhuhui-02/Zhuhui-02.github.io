# 命运转生仪式

一个 Cloudflare Pages 友好的“异世界转生”网站。流程分为三幕：

- 定下契约：通过多次确认进入转生仪式。
- 灵魂塑形：随机获得可用点数，自由分配能力，选择职业，并重掷身世、相貌和命运刻痕。
- 水晶球预言：根据最终命盘写出轻小说式生平。

## 本地预览

不装 Node 也可以直接预览：双击 `index.html`，或用浏览器打开这个文件。

这种方式下，页面的契约流程、点数分配、种族、相貌、职业选择和本地生平生成都会正常工作。部署到 Cloudflare Pages 后，水晶球会使用线上函数生成更完整的生平。

如果电脑上有 Node，也可以运行：

```bash
node dev-server.mjs
```

然后打开 `http://127.0.0.1:8788`。

## Cloudflare Pages

这个项目不需要构建步骤，可以直接把仓库连接到 Cloudflare Pages：

- Build command 留空
- Build output directory 填 `.`
- Functions 会自动读取 `functions/api/generate.js`

如果要启用线上生平生成，在 Cloudflare Pages 的环境变量里设置：

- `OPENAI_API_KEY`
- `AI_MODEL`
- 可选：`OPENAI_BASE_URL`

没有配置这些变量时，页面会使用本地规则生成生平，仍然完整可用。
