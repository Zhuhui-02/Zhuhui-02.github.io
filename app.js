const STORAGE_KEY = "novel-memory-translator-project";
const SETTINGS_KEY = "novel-memory-translator-settings";

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
  if (!$("#save-api-key").checked) settings.apiKey = "";
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    $("#api-base-url").value = settings.baseUrl || "";
    $("#api-model").value = settings.model || "";
    $("#style-select").value = settings.style || "webnovel";
    $("#save-api-key").checked = Boolean(settings.apiKey);
    if (settings.apiKey) $("#api-key").value = settings.apiKey;
  } catch {
    localStorage.removeItem(SETTINGS_KEY);
  }
}

function readSettings() {
  return {
    baseUrl: $("#api-base-url").value.trim(),
    model: $("#api-model").value.trim(),
    apiKey: $("#api-key").value.trim(),
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
    list.innerHTML = `<p class="hint">导入 TXT、EPUB、Kakuyomu，或粘贴原文后，章节会出现在这里。</p>`;
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
    const chapters = await parseEpub(file);
    setChapters(chapters, $("#project-title").value);
    showToast(`已载入 EPUB：${chapters.length} 章`);
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
    });
  });

  const chapters = [];
  for (const itemref of opf.querySelectorAll("spine itemref")) {
    const item = manifest.get(itemref.getAttribute("idref"));
    if (!item || !/x?html/i.test(item.type || "")) continue;
    const path = normalizeZipPath(baseDir + item.href);
    const html = await zip.file(path)?.async("text");
    if (!html) continue;
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script, style, nav").forEach((node) => node.remove());
    const title = cleanText(doc.querySelector("h1,h2,h3,title")?.textContent || `章节 ${chapters.length + 1}`);
    const body = cleanText(doc.body?.innerText || doc.documentElement.textContent || "");
    if (body) chapters.push({ title, source: body });
  }

  return chapters.length ? chapters : [{ title: file.name.replace(/\.epub$/i, ""), source: "EPUB 中没有找到可读取章节。" }];
}

function normalizeZipPath(path) {
  const parts = [];
  path.split("/").forEach((part) => {
    if (!part || part === ".") return;
    if (part === "..") parts.pop();
    else parts.push(decodeURIComponent(part));
  });
  return parts.join("/");
}

async function fetchKakuyomu() {
  const url = $("#kakuyomu-url").value.trim();
  if (!url) {
    showToast("请先填写 Kakuyomu URL。");
    return;
  }

  $("#fetch-kakuyomu").disabled = true;
  $("#fetch-kakuyomu").textContent = "读取中";
  try {
    const response = await fetch(`/api/kakuyomu?url=${encodeURIComponent(url)}`);
    const data = await readJsonResponse(response, "Kakuyomu 接口不可用。请在 Cloudflare Pages 或 Wrangler 环境中测试读取。");
    if (!response.ok) throw new Error(data.error || "读取失败");
    setChapters(data.chapters, data.title || "Kakuyomu 文本");
    showToast(`已读取 ${data.chapters.length} 个章节`);
  } catch (error) {
    showToast(error.message || "Kakuyomu 读取失败。");
  } finally {
    $("#fetch-kakuyomu").disabled = false;
    $("#fetch-kakuyomu").textContent = "读取 Kakuyomu";
  }
}

function compactMemory() {
  return Object.fromEntries(
    Object.entries(state.memory).map(([key, rows]) => [key, rows.slice(-40)]),
  );
}

function splitForTranslation(text, maxLength = 2600) {
  const paragraphs = cleanText(text).split(/\n{2,}|\n/).filter(Boolean);
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

async function translateChapter(chapter, chapterIndex, totalChapters) {
  const settings = readSettings();
  const chunks = splitForTranslation(chapter.source);
  const translatedChunks = [];

  for (let index = 0; index < chunks.length; index += 1) {
    $("#progress-text").textContent = `正在翻译 ${chapterIndex + 1}/${totalChapters}：${index + 1}/${chunks.length}`;
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api: {
          baseUrl: settings.baseUrl,
          model: settings.model,
          apiKey: settings.apiKey,
        },
        style: settings.style,
        chapterTitle: chapter.title,
        segmentIndex: index + 1,
        segmentTotal: chunks.length,
        sourceText: chunks[index],
        memory: compactMemory(),
      }),
    });

    const data = await readJsonResponse(response, "翻译接口不可用。请在 Cloudflare Pages 或 Wrangler 环境中测试翻译。");
    if (!response.ok) throw new Error(data.error || `翻译接口返回 ${response.status}`);
    translatedChunks.push(data.translation || "");
    mergeMemory(data.memory, chapter.title);
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

  $("#fetch-kakuyomu").addEventListener("click", fetchKakuyomu);
  $("#translate-current").addEventListener("click", translateCurrent);
  $("#translate-all").addEventListener("click", translateAll);

  $("#project-title").addEventListener("input", () => {
    state.title = $("#project-title").value.trim();
    saveProject();
  });

  ["api-base-url", "api-model", "api-key", "style-select", "save-api-key"].forEach((id) => {
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
