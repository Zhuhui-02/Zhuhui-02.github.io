const STORAGE_KEY = "novel-memory-translator-project";
const SETTINGS_KEY = "novel-memory-translator-settings";
const EPUB_MIN_STANDALONE_CHARS = 280;

const memoryMeta = {
  terms: {
    title: "术语表",
    headers: ["原文", "译文", "说明", "首次出现"],
    fields: ["source", "target", "note", "chapter"],
    key: ["source"],
  },
  timeline: {
    title: "时空表格",
    headers: ["时间/阶段", "地点/世界", "说明", "首次出现"],
    fields: ["time", "place", "note", "chapter"],
    key: ["time", "place"],
  },
  characters: {
    title: "角色特征表格",
    headers: ["原名", "译名", "身份", "特征", "首次出现"],
    fields: ["sourceName", "targetName", "role", "traits", "chapter"],
    key: ["sourceName"],
  },
  relationships: {
    title: "角色与主角社交表格",
    headers: ["角色", "与主角关系", "态度", "变化", "首次出现"],
    fields: ["character", "relation", "attitude", "development", "chapter"],
    key: ["character", "relation"],
  },
  directives: {
    title: "任务、命令或者约定表格",
    headers: ["类型", "内容", "关联人物", "状态", "首次出现"],
    fields: ["type", "content", "people", "status", "chapter"],
    key: ["type", "content"],
  },
  events: {
    title: "重要事件历史表格",
    headers: ["事件", "时间/章节", "影响", "相关人物", "首次出现"],
    fields: ["event", "time", "impact", "people", "chapter"],
    key: ["event"],
  },
  items: {
    title: "重要物品表格",
    headers: ["原名", "译名", "类别", "说明", "首次出现"],
    fields: ["sourceName", "targetName", "type", "note", "chapter"],
    key: ["sourceName"],
  },
};

const state = {
  title: "",
  chapters: [],
  activeChapterId: null,
  memory: createEmptyMemory(),
  activeMemoryTab: "terms",
  translating: false,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function createEmptyMemory() {
  return Object.fromEntries(Object.keys(memoryMeta).map((key) => [key, []]));
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u3000/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function activeChapter() {
  return state.chapters.find((chapter) => chapter.id === state.activeChapterId) || state.chapters[0] || null;
}

function setChapters(chapters, title = state.title || "未命名项目") {
  state.title = title;
  state.chapters = chapters.map((chapter, index) => ({
    id: chapter.id || uid("chapter"),
    title: chapter.title || `第 ${index + 1} 章`,
    source: cleanText(chapter.source),
    translation: chapter.translation || "",
    translated: Boolean(chapter.translation),
  }));
  state.activeChapterId = state.chapters[0]?.id || null;
  $("#project-title").value = state.title;
  saveProject();
  renderAll();
}

function saveProject() {
  const payload = {
    title: state.title,
    chapters: state.chapters,
    activeChapterId: state.activeChapterId,
    memory: state.memory,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadProject() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    state.title = data.title || "";
    state.chapters = Array.isArray(data.chapters) ? data.chapters : [];
    state.activeChapterId = data.activeChapterId || state.chapters[0]?.id || null;
    state.memory = { ...createEmptyMemory(), ...(data.memory || {}) };
    $("#project-title").value = state.title;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function saveSettings() {
  const settings = readSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    $("#style-select").value = settings.style || "webnovel";
  } catch {
    localStorage.removeItem(SETTINGS_KEY);
  }
}

function readSettings() {
  return {
    style: $("#style-select").value,
  };
}

function renderAll() {
  renderStatus();
  renderChapters();
  renderPreviews();
  renderMemoryTable();
}

function renderStatus() {
  const translated = state.chapters.filter((chapter) => chapter.translated).length;
  const total = state.chapters.length;
  $("#project-status").textContent = total ? `${translated} / ${total} 章已翻译` : "未载入文本";
}

function renderChapters() {
  const list = $("#chapter-list");
  if (!state.chapters.length) {
    list.innerHTML = `<p class="hint">导入 TXT、EPUB、在线连载网页，或粘贴原文后，章节会出现在这里。</p>`;
    return;
  }

  list.innerHTML = state.chapters
    .map((chapter, index) => {
      const status = chapter.translated ? "已翻译" : "未翻译";
      return `
        <button class="chapter-button ${chapter.id === state.activeChapterId ? "active" : ""}" data-chapter="${chapter.id}" type="button">
          <strong>${index + 1}. ${escapeHtml(chapter.title)}</strong>
          <span>${chapter.source.length} 字符 · ${status}</span>
        </button>
      `;
    })
    .join("");

  $$("[data-chapter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeChapterId = button.dataset.chapter;
      saveProject();
      renderAll();
    });
  });
}

function renderPreviews() {
  const chapter = activeChapter();
  $("#active-chapter-title").textContent = chapter ? chapter.title : "未选择章节";
  $("#source-count").textContent = chapter ? `${chapter.source.length} 字符` : "0 字符";
  $("#source-preview").textContent = chapter?.source || "暂无原文。";
  $("#translation-state").textContent = chapter?.translated ? "已生成译文" : "等待翻译";
  $("#translation-preview").innerHTML = chapter?.translation
    ? formatParagraphs(chapter.translation)
    : `<p class="hint">翻译完成后会直接显示在这里。</p>`;
}

function formatParagraphs(text) {
  return cleanText(text)
    .split(/\n{2,}|\n/)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
}

function showTranslationError(error) {
  const message = error?.message || "翻译失败。";
  $("#translation-state").textContent = "翻译失败";
  $("#translation-preview").innerHTML = `
    <p class="error-text">${escapeHtml(message)}</p>
  `;
}

function renderMemoryTable() {
  const meta = memoryMeta[state.activeMemoryTab];
  $("#memory-title").textContent = meta.title;
  const rows = state.memory[state.activeMemoryTab] || [];
  const head = `<thead><tr>${meta.headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>`;
  const bodyRows = rows.length
    ? rows
        .map(
          (row) => `
            <tr>
              ${meta.fields.map((field) => `<td>${escapeHtml(row[field] || "")}</td>`).join("")}
            </tr>
          `,
        )
        .join("")
    : `<tr><td colspan="${meta.fields.length}">暂无记录。翻译时会自动补充。</td></tr>`;
  $("#memory-table").innerHTML = `${head}<tbody>${bodyRows}</tbody>`;
}

function switchTab(tab) {
  $$(".tab").forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  $$("[data-view]").forEach((view) => view.classList.toggle("active", view.dataset.view === tab));
}

function switchMemoryTab(tab) {
  state.activeMemoryTab = tab;
  $$("[data-memory-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.memoryTab === tab);
  });
  renderMemoryTable();
}

async function handleFile(file) {
  if (!file) return;
  const lowerName = file.name.toLowerCase();
  $("#project-title").value = file.name.replace(/\.(txt|epub)$/i, "");
  if (lowerName.endsWith(".epub")) {
    if (!window.JSZip) {
      showToast("EPUB 解析库还没有加载完成，请稍后再试。");
      return;
    }
    try {
      const chapters = await parseEpub(file);
      setChapters(chapters, $("#project-title").value);
      showToast(`已载入 EPUB：${chapters.length} 章`);
    } catch (error) {
      showToast(error.message || "EPUB 解析失败。");
    }
    return;
  }

  const text = await file.text();
  const chapters = splitPlainText(text);
  setChapters(chapters, $("#project-title").value);
  showToast(`已载入 TXT：${chapters.length} 章`);
}

function splitPlainText(text) {
  const source = cleanText(text);
  if (!source) return [];
  const lines = source.split("\n");
  const chapters = [];
  let currentTitle = "正文";
  let buffer = [];
  const chapterPattern = /^(第[一二三四五六七八九十百千万零〇0-9]+[章话節节幕卷].{0,40}|chapter\s+\d+.{0,40}|[0-9]{1,4}[.、]\s*.{1,60})$/i;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && chapterPattern.test(trimmed) && buffer.join("\n").trim().length > 120) {
      chapters.push({ title: currentTitle, source: buffer.join("\n").trim() });
      currentTitle = trimmed;
      buffer = [];
      return;
    }
    if (trimmed && chapterPattern.test(trimmed) && buffer.length === 0) {
      currentTitle = trimmed;
      return;
    }
    buffer.push(line);
  });

  if (buffer.join("\n").trim()) chapters.push({ title: currentTitle, source: buffer.join("\n").trim() });
  return chapters.length ? chapters : [{ title: "正文", source }];
}

async function parseEpub(file) {
  const zip = await window.JSZip.loadAsync(await file.arrayBuffer());
  const container = await zip.file("META-INF/container.xml")?.async("text");
  if (!container) throw new Error("EPUB 缺少 container.xml");

  const xml = new DOMParser().parseFromString(container, "application/xml");
  const opfPath = xml.querySelector("rootfile")?.getAttribute("full-path");
  if (!opfPath) throw new Error("EPUB 缺少 OPF 文件");

  const opfText = await zip.file(opfPath)?.async("text");
  const opf = new DOMParser().parseFromString(opfText, "application/xml");
  const baseDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const manifest = new Map();
  opf.querySelectorAll("manifest item").forEach((item) => {
    manifest.set(item.getAttribute("id"), {
      href: item.getAttribute("href"),
      type: item.getAttribute("media-type"),
      properties: item.getAttribute("properties") || "",
    });
  });

  const tocTitles = await readEpubToc(zip, manifest, baseDir);
  const sections = [];
  for (const itemref of opf.querySelectorAll("spine itemref")) {
    if (itemref.getAttribute("linear") === "no") continue;
    const item = manifest.get(itemref.getAttribute("idref"));
    if (!item || !/x?html/i.test(item.type || "")) continue;
    const path = normalizeZipPath(baseDir + item.href);
    const html = await zip.file(path)?.async("text");
    if (!html) continue;
    const doc = new DOMParser().parseFromString(html, "text/html");

    const title = getEpubSectionTitle(doc, tocTitles.get(path), sections.length + 1);
    const body = extractEpubText(doc);
    if (!body || isEpubUtilityPage(title, body, path)) continue;
    sections.push({ title, source: body, path });
  }

  const chapters = mergeEpubSections(sections);
  return chapters.length ? chapters : [{ title: file.name.replace(/\.epub$/i, ""), source: "EPUB 中没有找到可读取章节。" }];
}

async function readEpubToc(zip, manifest, baseDir) {
  const titles = new Map();
  for (const item of manifest.values()) {
    const path = normalizeZipPath(baseDir + item.href);
    if (item.properties.includes("nav") || /ncx/i.test(item.type || "")) {
      const text = await zip.file(path)?.async("text");
      if (!text) continue;
      const doc = new DOMParser().parseFromString(text, item.type?.includes("ncx") ? "application/xml" : "text/html");
      const basePath = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";

      doc.querySelectorAll("nav a[href], a[href]").forEach((link) => {
        const href = link.getAttribute("href");
        const title = cleanText(link.textContent);
        if (!href || !title) return;
        titles.set(resolveEpubHref(basePath, href), title);
      });

      doc.querySelectorAll("navPoint").forEach((point) => {
        const href = point.querySelector("content")?.getAttribute("src");
        const title = cleanText(point.querySelector("navLabel text")?.textContent);
        if (!href || !title) return;
        titles.set(resolveEpubHref(basePath, href), title);
      });
    }
  }
  return titles;
}

function getEpubSectionTitle(doc, tocTitle, index) {
  const heading = cleanText(doc.querySelector("h1,h2,h3,.chapter-title,.title,.p-title")?.textContent || "");
  const htmlTitle = cleanText(doc.querySelector("title")?.textContent || "");
  return tocTitle || heading || htmlTitle || `章节 ${index}`;
}

function extractEpubText(doc) {
  const clone = doc.cloneNode(true);
  clone.querySelectorAll("script, style, nav, header, footer, aside, svg, img, audio, video, rp, rt").forEach((node) => node.remove());
  const body = clone.querySelector("body") || clone.documentElement;
  return cleanText(body?.innerText || body?.textContent || "");
}

function isEpubUtilityPage(title, body, path) {
  const signal = `${title} ${path}`.toLowerCase();
  const utilityPattern = /(cover|toc|contents|nav|copyright|colophon|titlepage|表紙|目次|奥付|著作権|版权|目录)/i;
  if (utilityPattern.test(signal) && body.length < 1200) return true;

  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  const linkLikeLines = lines.filter((line) => /^(第.+[章話话]|chapter\s+\d+|\d+[.、]\s*)/i.test(line)).length;
  return lines.length >= 8 && linkLikeLines / lines.length > 0.65;
}

function mergeEpubSections(sections) {
  const chapters = [];
  sections.forEach((section) => {
    const last = chapters[chapters.length - 1];
    const repeatedTitle = last && normalizeChapterTitle(last.title) === normalizeChapterTitle(section.title);
    const genericContinuation =
      last && isGenericEpubTitle(section.title) && !looksLikeChapterStart(section.title, section.source) && last.source.length < 3600;
    const shouldMergeBack =
      last && section.source.length < EPUB_MIN_STANDALONE_CHARS && !looksLikeChapterStart(section.title, section.source);
    const shouldAppendToShortLast = last && last.source.length < EPUB_MIN_STANDALONE_CHARS && !looksLikeChapterStart(section.title, section.source);

    if (repeatedTitle || genericContinuation || shouldMergeBack || shouldAppendToShortLast) {
      last.source = `${last.source}\n\n${section.source}`;
      if (/^(章节|section)\s*\d+$/i.test(last.title)) last.title = section.title;
      return;
    }

    chapters.push({ title: section.title, source: section.source });
  });

  return chapters.map((chapter, index) => ({
    title: chapter.title || `章节 ${index + 1}`,
    source: chapter.source,
  }));
}

function looksLikeChapterStart(title, source) {
  const text = `${title}\n${source.slice(0, 160)}`;
  return /(第[一二三四五六七八九十百千万零〇0-9]+[章話话節节幕卷]|chapter\s+\d+|prologue|epilogue|プロローグ|エピローグ|序章|終章|幕間)/i.test(text);
}

function isGenericEpubTitle(title) {
  return /^(章节|section)\s*\d+$/i.test(title || "");
}

function normalizeChapterTitle(title) {
  return cleanText(title).replace(/\s+/g, "").toLowerCase();
}

function resolveEpubHref(basePath, href) {
  return normalizeZipPath(`${basePath}${href.split("#")[0].split("?")[0]}`);
}

function normalizeZipPath(path) {
  const parts = [];
  path.split("#")[0].split("?")[0].split("/").forEach((part) => {
    if (!part || part === ".") return;
    if (part === "..") parts.pop();
    else parts.push(decodeURIComponent(part));
  });
  return parts.join("/");
}

async function fetchSource() {
  const url = $("#source-url").value.trim();
  if (!url) {
    showToast("请先填写在线小说 URL。");
    return;
  }

  $("#fetch-source").disabled = true;
  $("#fetch-source").textContent = "读取中";
  try {
    const response = await fetch(`/api/source?url=${encodeURIComponent(url)}`);
    const data = await readJsonResponse(response, "网页读取接口不可用。请在 Cloudflare Pages 或 Wrangler 环境中测试读取。");
    if (!response.ok) throw new Error(data.error || "读取失败");
    setChapters(data.chapters, data.title || "在线小说文本");
    showToast(`已从 ${data.site || "网页"} 读取 ${data.chapters.length} 个章节`);
  } catch (error) {
    showToast(error.message || "网页读取失败。");
  } finally {
    $("#fetch-source").disabled = false;
    $("#fetch-source").textContent = "读取网页";
  }
}

function compactMemory() {
  return Object.fromEntries(
    Object.entries(state.memory).map(([key, rows]) => [key, rows.slice(-40)]),
  );
}

function splitForTranslation(text, maxLength = 2600) {
  const paragraphs = splitByNaturalBoundary(cleanText(text)).flatMap((part) => splitLongPart(part, maxLength));
  const chunks = [];
  let current = "";
  paragraphs.forEach((paragraph) => {
    if ((current + "\n" + paragraph).length > maxLength && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n${paragraph}` : paragraph;
    }
  });
  if (current) chunks.push(current);
  return chunks.length ? chunks : [text];
}

function splitLongPart(text, maxLength) {
  if (text.length <= maxLength) return [text];
  const chunks = [];
  for (let index = 0; index < text.length; index += maxLength) {
    chunks.push(text.slice(index, index + maxLength));
  }
  return chunks;
}

function splitByNaturalBoundary(text) {
  return text
    .split(/(?<=[。！？!?」』）])\s*|\n{2,}|\n/)
    .map((part) => cleanText(part))
    .filter(Boolean);
}

function splitChunkInHalf(text) {
  const parts = splitByNaturalBoundary(text);
  if (parts.length <= 1) {
    const midpoint = Math.ceil(text.length / 2);
    return [text.slice(0, midpoint), text.slice(midpoint)].map(cleanText).filter(Boolean);
  }

  const target = Math.ceil(text.length / 2);
  const first = [];
  const second = [];
  let count = 0;
  parts.forEach((part) => {
    if (count < target) {
      first.push(part);
      count += part.length;
    } else {
      second.push(part);
    }
  });
  return [first.join("\n"), second.join("\n")].map(cleanText).filter(Boolean);
}

function isRiskRejection(error) {
  return /high risk|rejected|risk|safety|安全|风险|拒绝/i.test(error?.message || "");
}

async function requestTranslationSegment({ settings, chapter, sourceText, segmentIndex, segmentTotal, retryDepth = 0 }) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      style: settings.style,
      chapterTitle: chapter.title,
      segmentIndex,
      segmentTotal,
      sourceText,
      memory: compactMemory(),
    }),
  });

  const data = await readJsonResponse(response, "翻译接口不可用。请在 Cloudflare Pages 或 Wrangler 环境中测试翻译。");
  if (response.ok) return [data];

  const error = new Error(data.error || `翻译接口返回 ${response.status}`);
  if (isRiskRejection(error) && retryDepth < 3 && sourceText.length > 180) {
    const smallerChunks = splitChunkInHalf(sourceText);
    if (smallerChunks.length > 1) {
      const results = [];
      for (let index = 0; index < smallerChunks.length; index += 1) {
        $("#progress-text").textContent = `片段被安全策略拦截，正在拆小重试：${retryDepth + 1}.${index + 1}`;
        const nested = await requestTranslationSegment({
          settings,
          chapter,
          sourceText: smallerChunks[index],
          segmentIndex,
          segmentTotal,
          retryDepth: retryDepth + 1,
        });
        results.push(...nested);
      }
      return results;
    }
  }

  throw error;
}

async function translateChapter(chapter, chapterIndex, totalChapters) {
  const settings = readSettings();
  const chunks = splitForTranslation(chapter.source);
  const translatedChunks = [];

  for (let index = 0; index < chunks.length; index += 1) {
    $("#progress-text").textContent = `正在翻译 ${chapterIndex + 1}/${totalChapters}：${index + 1}/${chunks.length}`;
    const results = await requestTranslationSegment({
      settings,
      chapter,
      sourceText: chunks[index],
      segmentIndex: index + 1,
      segmentTotal: chunks.length,
    });
    results.forEach((data) => {
      translatedChunks.push(data.translation || "");
      mergeMemory(data.memory, chapter.title);
    });
    chapter.translation = translatedChunks.join("\n\n");
    chapter.translated = true;
    saveProject();
    renderAll();
  }
}

async function readJsonResponse(response, fallbackMessage) {
  try {
    return await response.json();
  } catch {
    return { error: fallbackMessage };
  }
}

async function translateCurrent() {
  const chapter = activeChapter();
  if (!chapter || state.translating) return;
  state.translating = true;
  setTranslateButtons(true);
  try {
    await translateChapter(chapter, state.chapters.indexOf(chapter), state.chapters.length);
    $("#progress-text").textContent = "当前章翻译完成";
    showToast("当前章已翻译完成。");
  } catch (error) {
    $("#progress-text").textContent = "翻译中断";
    showTranslationError(error);
    showToast(error.message || "翻译失败。");
  } finally {
    state.translating = false;
    setTranslateButtons(false);
  }
}

async function translateAll() {
  if (!state.chapters.length || state.translating) return;
  state.translating = true;
  setTranslateButtons(true);
  try {
    for (let index = 0; index < state.chapters.length; index += 1) {
      state.activeChapterId = state.chapters[index].id;
      renderAll();
      await translateChapter(state.chapters[index], index, state.chapters.length);
    }
    $("#progress-text").textContent = "全部章节翻译完成";
    showToast("全部章节已翻译完成。");
  } catch (error) {
    $("#progress-text").textContent = "翻译中断";
    showTranslationError(error);
    showToast(error.message || "翻译失败。");
  } finally {
    state.translating = false;
    setTranslateButtons(false);
    saveProject();
    renderAll();
  }
}

function setTranslateButtons(disabled) {
  $("#translate-current").disabled = disabled;
  $("#translate-all").disabled = disabled;
}

function mergeMemory(incoming, chapterTitle) {
  if (!incoming || typeof incoming !== "object") return;

  Object.entries(memoryMeta).forEach(([table, meta]) => {
    const rows = Array.isArray(incoming[table]) ? incoming[table] : [];
    rows.forEach((row) => {
      const normalized = {};
      meta.fields.forEach((field) => {
        normalized[field] = cleanCell(row[field]);
      });
      if (!normalized.chapter) normalized.chapter = chapterTitle;
      const signature = meta.key.map((field) => normalized[field]).join("::").toLowerCase();
      if (!signature.replace(/:/g, "")) return;

      const existing = state.memory[table].find((item) => {
        const itemSignature = meta.key.map((field) => cleanCell(item[field])).join("::").toLowerCase();
        return itemSignature === signature;
      });

      if (existing) {
        meta.fields.forEach((field) => {
          if (normalized[field] && !String(existing[field] || "").includes(normalized[field])) {
            existing[field] = existing[field] ? `${existing[field]}；${normalized[field]}` : normalized[field];
          }
        });
      } else {
        state.memory[table].push(normalized);
      }
    });
  });
}

function cleanCell(value) {
  if (Array.isArray(value)) return value.map(cleanCell).filter(Boolean).join("、").slice(0, 260);
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 260);
}

function buildTxt() {
  return state.chapters
    .map((chapter) => `# ${chapter.title}\n\n${chapter.translation || ""}`.trim())
    .join("\n\n");
}

function buildHtml() {
  const body = state.chapters
    .map(
      (chapter) => `
        <section>
          <h2>${escapeHtml(chapter.title)}</h2>
          ${formatParagraphs(chapter.translation || "")}
        </section>
      `,
    )
    .join("\n");
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(state.title || "译文")}</title>
  <style>
    body{max-width:820px;margin:40px auto;padding:0 20px;font-family:"Noto Serif SC","Songti SC",serif;line-height:1.9;color:#20242a}
    h1{font-size:2rem} h2{margin-top:2.2rem;border-bottom:1px solid #ddd;padding-bottom:.4rem}
    p{margin:0 0 1em}
  </style>
</head>
<body>
  <h1>${escapeHtml(state.title || "译文")}</h1>
  ${body}
</body>
</html>`;
}

function download(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function safeName(name, fallback = "novel-translation") {
  return (name || fallback).replace(/[\\/:*?"<>|]+/g, "_").slice(0, 80) || fallback;
}

function bindEvents() {
  $$(".tab").forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));
  $$("[data-memory-tab]").forEach((button) => {
    button.addEventListener("click", () => switchMemoryTab(button.dataset.memoryTab));
  });

  $("#file-input").addEventListener("change", (event) => handleFile(event.target.files[0]));
  const dropZone = $("#drop-zone");
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add("dragging");
    });
  });
  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.remove("dragging");
    });
  });
  dropZone.addEventListener("drop", (event) => handleFile(event.dataTransfer.files[0]));

  $("#use-paste").addEventListener("click", () => {
    const text = $("#paste-source").value;
    if (!cleanText(text)) {
      showToast("请先粘贴原文。");
      return;
    }
    const title = $("#project-title").value.trim() || "粘贴文本";
    setChapters([{ title: "正文", source: text }], title);
    showToast("已载入粘贴文本。");
  });

  $("#fetch-source").addEventListener("click", fetchSource);
  $("#translate-current").addEventListener("click", translateCurrent);
  $("#translate-all").addEventListener("click", translateAll);

  $("#project-title").addEventListener("input", () => {
    state.title = $("#project-title").value.trim();
    saveProject();
  });

  ["style-select"].forEach((id) => {
    $(`#${id}`).addEventListener("change", saveSettings);
  });

  $("#clear-project").addEventListener("click", () => {
    if (!window.confirm("清空当前项目和记忆表？")) return;
    state.title = "";
    state.chapters = [];
    state.activeChapterId = null;
    state.memory = createEmptyMemory();
    $("#project-title").value = "";
    localStorage.removeItem(STORAGE_KEY);
    renderAll();
  });

  $("#export-memory").addEventListener("click", () => {
    download(`${safeName(state.title, "memory")}-memory.json`, JSON.stringify(state.memory, null, 2), "application/json;charset=utf-8");
  });
  $("#download-txt").addEventListener("click", () => download(`${safeName(state.title)}.txt`, buildTxt()));
  $("#download-html").addEventListener("click", () => download(`${safeName(state.title)}.html`, buildHtml(), "text/html;charset=utf-8"));
  $("#download-project").addEventListener("click", () => {
    const payload = {
      title: state.title,
      chapters: state.chapters,
      memory: state.memory,
      exportedAt: new Date().toISOString(),
    };
    download(`${safeName(state.title, "translation-project")}.json`, JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
  });
}

loadSettings();
loadProject();
bindEvents();
renderAll();
