const FALLBACK_MAX_LENGTH = 1800;

export async function onRequestPost({ request, env }) {
  try {
    const { profile } = await request.json();

    if (!profile || typeof profile !== "object") {
      return json({ error: "缺少转生档案。" }, 400);
    }

    const apiKey = env.OPENAI_API_KEY;
    const model = env.AI_MODEL;
    const baseUrl = env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    if (!apiKey || !model) {
      return json({ biography: fallbackBiography(profile), source: "local-oracle" });
    }

    const prompt = buildPrompt(profile);
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "你是一位中文轻小说风格的角色生平作者。写作要有画面感、节奏感和命运感，但不要堆砌设定。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.92,
        max_tokens: 900,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return json(
        {
          biography: fallbackBiography(profile),
          source: "local-oracle",
          warning: detail.slice(0, 240),
        },
        200,
      );
    }

    const data = await response.json();
    const biography = data?.choices?.[0]?.message?.content?.trim();
    return json({
      biography: biography || fallbackBiography(profile),
      source: biography ? "crystal-oracle" : "local-oracle",
    });
  } catch (error) {
    return json({ error: "生成失败，请稍后再试。" }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

function buildPrompt(profile) {
  return `请基于下面的“异世界转生 roll 点档案”，生成一段 500 到 800 字的中文生平。

要求：
1. 像漫画或轻小说角色简介，不要像游戏数值表。
2. 保留角色的种族、出身、职业倾向、外貌、天赋、祝福、诅咒和能力强弱。
3. 写出童年或醒来场景、第一次能力显现、一个重大转折、未来伏笔。
4. 分成 3 到 5 个自然段，不要输出标题。

档案：
${JSON.stringify(normalizeProfile(profile), null, 2)}`;
}

function normalizeProfile(profile) {
  return {
    name: clean(profile.name),
    title: clean(profile.title),
    race: Array.isArray(profile.race) ? profile.race.map(clean) : clean(profile.race),
    origin: clean(profile.origin),
    calling: clean(profile.calling),
    appearance: clean(profile.appearance),
    ability: profile.ability,
    tags: Array.isArray(profile.tags)
      ? profile.tags.map((tag) => (Array.isArray(tag) ? tag.map(clean) : clean(tag)))
      : [],
    total: Number(profile.total) || 0,
  };
}

function clean(value) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .slice(0, 180);
}

function fallbackBiography(profile) {
  const safe = normalizeProfile(profile);
  const race = Array.isArray(safe.race) ? safe.race[0] : safe.race;
  const tags = Array.isArray(safe.tags) ? safe.tags : [];
  const talent = tags[0]?.[1] || "未知天赋";
  const blessing = tags[1]?.[1] || "无名祝福";
  const curse = tags[2]?.[1] || "未解诅咒";

  return `${safe.name || "无名者"} 在异世界醒来时，第一眼看见的是陌生天花板上缓慢转动的星图。这个新生的${race || "旅人"}被${safe.origin || "边境小镇"}收留，外貌特征是${safe.appearance || "难以形容的神秘气质"}。登记官原本只想写下一个普通名字，却在灵魂秤上看见了异常明亮的光。

成长的日子并不平稳。${safe.name || "这名转生者"} 选择走向「${safe.calling || "冒险者"}」的道路，能力总值达到 ${safe.total || 0}，其中最醒目的力量在危险时才会显露。天赋「${talent}」让许多不可能的选择忽然出现，祝福「${blessing}」则像藏在袖口里的小小火种，常在绝境里亮起。

然而诅咒「${curse}」也悄悄改变着命运的方向。每当胜利近在眼前，总会有误会、代价或新的谜题从阴影里浮现。传闻北方迷宫深处有一本能记录前世姓名的银书，而${safe.name || "这名转生者"}已经收到第一封没有署名的邀请函。`.slice(
    0,
    FALLBACK_MAX_LENGTH,
  );
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders(),
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
