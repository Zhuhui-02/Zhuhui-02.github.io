const MAX_EPISODES = 30;

export async function onRequestGet({ request }) {
  try {
    const input = new URL(request.url).searchParams.get("url");
    if (!input) return json({ error: "缺少 Kakuyomu URL。" }, 400);

    const target = new URL(input);
    if (target.hostname !== "kakuyomu.jp") {
      return json({ error: "只能读取 kakuyomu.jp 页面。" }, 400);
    }

    const html = await fetchHtml(target.href);
    const title = extractTitle(html);
    const episodeText = extractEpisodeText(html);
    if (episodeText) {
      return json({
        title,
        chapters: [{ title: extractEpisodeTitle(html) || title || "Kakuyomu 章节", source: episodeText }],
      });
    }

    const episodeUrls = extractEpisodeUrls(html, target).slice(0, MAX_EPISODES);
    if (!episodeUrls.length) return json({ error: "没有在页面中找到可读取正文。" }, 422);

    const chapters = [];
    for (const url of episodeUrls) {
      const episodeHtml = await fetchHtml(url);
      const source = extractEpisodeText(episodeHtml);
      if (source) {
        chapters.push({
          title: extractEpisodeTitle(episodeHtml) || `章节 ${chapters.length + 1}`,
          source,
        });
      }
    }

    if (!chapters.length) return json({ error: "找到章节链接，但没有读取到正文。" }, 422);
    return json({ title, chapters });
  } catch (error) {
    return json({ error: error.message || "Kakuyomu 读取失败。" }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 novel-memory-translator/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`Kakuyomu 返回 ${response.status}`);
  return await response.text();
}

function extractTitle(html) {
  return decode(
    matchFirst(html, /<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
      matchFirst(html, /<title>([\s\S]*?)<\/title>/i) ||
      "Kakuyomu 文本",
  ).replace(/\s*-\s*カクヨム\s*$/, "");
}

function extractEpisodeTitle(html) {
  return decode(
    matchFirst(html, /<p[^>]+class="[^"]*widget-episodeTitle[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
      matchFirst(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
      "",
  );
}

function extractEpisodeText(html) {
  const body =
    matchFirst(html, /<div[^>]+class="[^"]*widget-episodeBody[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i) ||
    matchFirst(html, /<div[^>]+id="contentMain-inner"[^>]*>([\s\S]*?)<\/main>/i) ||
    "";
  if (!body) return "";
  return htmlToText(body);
}

function extractEpisodeUrls(html, baseUrl) {
  const urls = new Set();
  const pattern = /href="(\/works\/[^"]+\/episodes\/[^"#?]+)"/g;
  let match = pattern.exec(html);
  while (match) {
    urls.add(new URL(match[1], baseUrl).href);
    match = pattern.exec(html);
  }
  return Array.from(urls);
}

function htmlToText(html) {
  return decode(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<rp[\s\S]*?<\/rp>/gi, "")
      .replace(/<rt[\s\S]*?<\/rt>/gi, "")
      .replace(/<(p|br|div|li|h[1-6])[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n"),
  ).trim();
}

function matchFirst(text, pattern) {
  return text.match(pattern)?.[1] || "";
}

function decode(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function json(body, status = 200) {
  return Response.json(body, { status, headers: corsHeaders() });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
