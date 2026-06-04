const MAX_SOURCE_LENGTH = 9000;
const MIMO_BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1";
const MIMO_MODEL = "mimo-v2.5-pro";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const sourceText = clean(body.sourceText);
    if (!sourceText) return json({ error: "缺少需要翻译的原文。" }, 400);
    if (sourceText.length > MAX_SOURCE_LENGTH) return json({ error: "单次文本过长，请拆分后再试。" }, 400);

    const apiKey = env.MIMO_API_KEY || env.TRANSLATION_API_KEY || env.OPENAI_API_KEY;
    const model = env.MIMO_MODEL || MIMO_MODEL;
    const baseUrl = (env.MIMO_BASE_URL || MIMO_BASE_URL).replace(/\/$/, "");

    if (!apiKey || !model) {
      return json({ error: "缺少 MIMO_API_KEY。请在 Cloudflare Pages 环境变量中配置，不要写进前端代码。" }, 400);
    }

    const prompt = buildPrompt({
      sourceText,
      style: clean(body.style) || "webnovel",
      chapterTitle: clean(body.chapterTitle),
      segmentIndex: Number(body.segmentIndex) || 1,
      segmentTotal: Number(body.segmentTotal) || 1,
      memory: body.memory || {},
    });

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "你是严谨的日文轻小说中文译者和连续性编辑。请按平台安全规则进行中性、文学化翻译，不扩写、不美化、不增加原文没有的敏感细节。必须保持人名、地名、术语、称谓、技能名、物品名和角色关系一致。只输出可解析 JSON，不输出 Markdown。",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.35,
        max_tokens: 4096,
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      return json({ error: `翻译 API 请求失败：${raw.slice(0, 300)}` }, 502);
    }

    const data = JSON.parse(raw);
    const content = data?.choices?.[0]?.message?.content || "";
    const parsed = parseModelJson(content);
    return json(normalizeResult(parsed, sourceText));
  } catch (error) {
    return json({ error: error.message || "翻译失败。" }, 500);
  }
}

export async function onRequestGet({ env }) {
  const apiKey = env.MIMO_API_KEY || env.TRANSLATION_API_KEY || env.OPENAI_API_KEY;
  return json({
    ok: true,
    provider: "mimo",
    baseUrl: (env.MIMO_BASE_URL || MIMO_BASE_URL).replace(/\/$/, ""),
    model: env.MIMO_MODEL || MIMO_MODEL,
    hasApiKey: Boolean(apiKey),
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function buildPrompt({ sourceText, style, chapterTitle, segmentIndex, segmentTotal, memory }) {
  const styleGuide = {
    webnovel: "译成自然流畅的简体中文网文风格，保留轻小说对白节奏，避免腔调过古。",
    published: "译成偏出版轻小说的简体中文，句子更精炼，称谓和叙述更稳定。",
    literal: "偏忠实直译，尽量保留原句信息和语气，不随意增删设定。",
  }[style] || "译成自然流畅的简体中文。";

  return `请翻译下面的日文轻小说片段，并更新连续性记忆表。

翻译要求：
1. ${styleGuide}
2. 已有记忆表优先级最高；新增译名不要与既有译名冲突。
3. 对专有名词、称谓、技能、物品、组织、地名要稳定记录。
4. 若原文暗示时间、地点、角色关系、约定、任务、命令、重要事件或重要物品，请写入对应表格。
5. 不要扩写暴力、色情、自伤、违法、仇恨等敏感内容；只按原文做必要、克制、上下文中性的文学翻译。
6. 如果某个局部句子因平台安全策略无法翻译，只把该句替换为「[此句因平台安全策略未翻译]」，继续翻译其他句子并继续更新记忆表。
7. 不要解释流程，只返回 JSON。

返回 JSON 结构必须是：
{
  "translation": "完整中文译文",
  "memory": {
    "terms": [{"source":"原文词","target":"中文译名","note":"用途或语境","chapter":"章节"}],
    "timeline": [{"time":"时间或阶段","place":"地点或世界","note":"说明","chapter":"章节"}],
    "characters": [{"sourceName":"原名","targetName":"译名","role":"身份","traits":"外貌/性格/能力","chapter":"章节"}],
    "relationships": [{"character":"角色译名","relation":"与主角关系","attitude":"态度","development":"变化","chapter":"章节"}],
    "directives": [{"type":"任务/命令/约定","content":"内容","people":"相关人物","status":"状态","chapter":"章节"}],
    "events": [{"event":"事件","time":"时间或章节","impact":"影响","people":"相关人物","chapter":"章节"}],
    "items": [{"sourceName":"原名","targetName":"译名","type":"类别","note":"说明","chapter":"章节"}]
  }
}

章节：${chapterTitle || "未命名章节"}
片段：${segmentIndex} / ${segmentTotal}

已有记忆表：
${JSON.stringify(memory, null, 2)}

原文：
${sourceText}`;
}

function parseModelJson(content) {
  const trimmed = String(content || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return { translation: trimmed, memory: {} };
    return JSON.parse(match[0]);
  }
}

function normalizeResult(result, fallbackText) {
  const emptyMemory = {
    terms: [],
    timeline: [],
    characters: [],
    relationships: [],
    directives: [],
    events: [],
    items: [],
  };
  return {
    translation: clean(result?.translation) || fallbackText,
    memory: { ...emptyMemory, ...(result?.memory || {}) },
  };
}

function clean(value) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .trim();
}

function json(body, status = 200) {
  return Response.json(body, { status, headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
