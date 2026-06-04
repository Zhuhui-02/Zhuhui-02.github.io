const MAX_EPISODES = 40;
const SUPPORTED_HOSTS = [
  "kakuyomu.jp",
  "ncode.syosetu.com",
  "novel18.syosetu.com",
  "syosetu.org",
  "novelup.plus",
  "www.alphapolis.co.jp",
  "alphapolis.co.jp",
];

export async function onRequestGet({ request }) {
  try {
    const input = new URL(request.url).searchParams.get("url");
    if (!input) return json({ error: "缺少在线小说 URL。" }, 400);

    const target = new URL(input);
    if (!isSupportedHost(target.hostname)) {
      return json({ error: "暂不支持这个站点。请使用 Kakuyomu、Syosetu/Narou、Hameln、Novelup+，或常规可公开访问章节页。" }, 400);
    }

    const html = await fetchHtml(target.href);
    const site = detectSite(target.hostname);
    const title = extractTitle(html, site);
    const episodeText = extractEpisodeText(html, site);

    if (episodeText) {
      return json({
        site,
        title,
        chapters: [{ title: extractEpisodeTitle(html, site) || title || "在线章节", source: episodeText }],
      });
    }

    const episodeUrls = extractEpisodeUrls(html, target, site).slice(0, MAX_EPISODES);
    if (!episodeUrls.length) return json({ error: "没有在页面中找到可读取正文或章节链接。" }, 422);

    const chapters = [];
    for (const url of episodeUrls) {
      const episodeHtml = await fetchHtml(url);
      const source = extractEpisodeText(episodeHtml, site);
      if (source) {
        chapters.push({
          title: extractEpisodeTitle(episodeHtml, site) || `章节 ${chapters.length + 1}`,
          source,
        });
      }
    }

    if (!chapters.length) return json({ error: "找到章节链接，但没有读取到正文。" }, 422);
    return json({ site, title, chapters });
  } catch (error) {
    return json({ error: error.message || "网页读取失败。" }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function isSupportedHost(hostname) {
  return SUPPORTED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

function detectSite(hostname) {
  if (hostname.includes("kakuyomu")) return "Kakuyomu";
  if (hostname.includes("syosetu.com")) return "Syosetu/Narou";
  if (hostname.includes("syosetu.org")) return "Hameln";
  if (hostname.includes("novelup.plus")) return "Novelup+";
  if (hostname.includes("alphapolis.co.jp")) return "Alphapolis";
  return "Web";
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 novel-memory-translator/1.1",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!response.ok) throw new Error(`目标网站返回 ${response.status}`);
  return await response.text();
}

function extractTitle(html, site) {
  const candidates = [
    /<meta\s+property="og:title"\s+content="([^"]+)"/i,
    /<h1[^>]+class="[^"]*(?:p-novel__title|novel_title|widget-workTitle)[^"]*"[^>]*>([\s\S]*?)<\/h1>/i,
    /<div[^>]+class="[^"]*section3[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<title>([\s\S]*?)<\/title>/i,
  ];
  return cleanupTitle(firstMatch(html, candidates), site) || `${site} 文本`;
}

function extractEpisodeTitle(html, site) {
  const candidates = [
    /<p[^>]+class="[^"]*widget-episodeTitle[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
    /<h1[^>]+class="[^"]*(?:p-novel__title|novel_subtitle|chapter-title|chapterTitle)[^"]*"[^>]*>([\s\S]*?)<\/h1>/i,
    /<p[^>]+class="[^"]*(?:novel_subtitle|p-novel__subtitle)[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
    /<div[^>]+class="[^"]*novel_subtitle[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
  ];
  return decodeHtml(stripTags(firstMatch(html, candidates)));
}

function extractEpisodeText(html, site) {
  const body =
    matchFirst(html, /<div[^>]+class="[^"]*widget-episodeBody[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i) ||
    matchFirst(html, /<div[^>]+id="novel_honbun"[^>]*>([\s\S]*?)<\/div>/i) ||
    matchFirst(html, /<div[^>]+class="[^"]*p-novel__body[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/article>/i) ||
    matchFirst(html, /<div[^>]+id="honbun"[^>]*>([\s\S]*?)<\/div>/i) ||
    matchFirst(html, /<div[^>]+class="[^"]*(?:novel_view|chapter-body|episode-body|story-body|main_text)[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    matchFirst(html, /<article[^>]*>([\s\S]*?)<\/article>/i) ||
    matchFirst(html, /<main[^>]*>([\s\S]*?)<\/main>/i);

  if (!body) return "";
  const text = htmlToText(body);
  if (text.length < 80 && site !== "Web") return "";
  return text;
}

function extractEpisodeUrls(html, baseUrl, site) {
  const urls = new Set();
  const patterns = [
    /href="(\/works\/[^"]+\/episodes\/[^"#?]+)"/g,
    /href="(\/n[0-9a-z]+\/\d+\/?)"/gi,
    /href="(https:\/\/ncode\.syosetu\.com\/n[0-9a-z]+\/\d+\/?)"/gi,
    /href="(\/novel\/[^"]+\/\d+\.html)"/g,
    /href="(\/story\/[^"]+)"/g,
    /href="([^"]*\/episodes\/[^"#?]+)"/g,
  ];

  patterns.forEach((pattern) => {
    let match = pattern.exec(html);
    while (match) {
      try {
        urls.add(new URL(decodeHtml(match[1]), baseUrl).href);
      } catch {
        // Ignore malformed links from ads or scripts.
      }
      match = pattern.exec(html);
    }
  });

  return Array.from(urls).filter((url) => {
    const parsed = new URL(url);
    if (!isSupportedHost(parsed.hostname)) return false;
    if (site === "Syosetu/Narou") return /\/n[0-9a-z]+\/\d+\/?$/i.test(parsed.pathname);
    return true;
  });
}

function htmlToText(html) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<rp[\s\S]*?<\/rp>/gi, "")
      .replace(/<rt[\s\S]*?<\/rt>/gi, "")
      .replace(/<(p|br|div|li|h[1-6])[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\u3000/g, " "),
  ).trim();
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const value = matchFirst(text, pattern);
    if (value) return value;
  }
  return "";
}

function matchFirst(text, pattern) {
  return text.match(pattern)?.[1] || "";
}

function stripTags(value) {
  return String(value || "").replace(/<[^>]+>/g, "");
}

function cleanupTitle(value, site) {
  return decodeHtml(stripTags(value))
    .replace(/\s*-\s*カクヨム\s*$/, "")
    .replace(/\s*[-|]\s*小説家になろう\s*$/, "")
    .replace(/\s*[-|]\s*ハーメルン\s*$/, "")
    .replace(/\s*[-|]\s*ノベルアップ\+\s*$/, "")
    .replace(new RegExp(`\\s*[-|]\\s*${site}\\s*$`, "i"), "")
    .trim();
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
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
