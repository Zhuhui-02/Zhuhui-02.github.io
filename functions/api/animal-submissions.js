const REPOSITORY = "Zhuhui-02/Zhuhui-02.github.io";
const BRANCH = "main";
const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 900_000;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function onRequestPost({ request, env }) {
  try {
    const token = env.GITHUB_UPLOAD_TOKEN;
    if (!token) return json({ error: "投稿服务尚未配置，请联系管理员。" }, 503);

    const form = await request.formData();
    const species = cleanText(form.get("species"), 80);
    const notes = cleanText(form.get("notes"), 800);
    const photos = form.getAll("photos").filter((value) => value instanceof File);
    if (!species) return json({ error: "请填写物种名称。" }, 400);
    if (!photos.length) return json({ error: "请至少选择一张图片。" }, 400);
    if (photos.length > MAX_PHOTOS) return json({ error: `一次最多提交 ${MAX_PHOTOS} 张图片。` }, 400);

    for (const photo of photos) {
      if (!ALLOWED_TYPES.has(photo.type)) return json({ error: "图片仅支持 JPG、PNG 或 WebP。" }, 400);
      if (photo.size > MAX_PHOTO_BYTES) return json({ error: "图片过大，请重新选择。" }, 400);
    }

    const submissionId = crypto.randomUUID();
    const submittedAt = new Date().toISOString();
    const directory = `submissions/animals/${safePathSegment(species)}/${submittedAt.slice(0, 10)}-${submissionId}`;
    const uploaded = [];

    for (const [index, photo] of photos.entries()) {
      const extension = ALLOWED_TYPES.get(photo.type);
      const path = `${directory}/${String(index + 1).padStart(2, "0")}.${extension}`;
      await putFile(token, path, await photo.arrayBuffer(), `Add animal submission: ${species}`);
      uploaded.push({ path, type: photo.type, size: photo.size });
    }

    const metadata = { id: submissionId, species, notes, submittedAt, photos: uploaded };
    await putFile(
      token,
      `${directory}/submission.json`,
      new TextEncoder().encode(JSON.stringify(metadata, null, 2)).buffer,
      `Add animal submission metadata: ${species}`,
    );

    return json({ ok: true, submissionId, photoCount: uploaded.length });
  } catch (error) {
    return json({ error: error.message || "提交失败，请稍后重试。" }, 500);
  }
}

export async function onRequestGet({ env }) {
  return json({ ok: true, configured: Boolean(env.GITHUB_UPLOAD_TOKEN) });
}

async function putFile(token, path, bytes, message) {
  const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/contents/${encodePath(path)}`, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "zju-animal-submissions",
    },
    body: JSON.stringify({ message, content: toBase64(bytes), branch: BRANCH }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.message ? `图片保存失败：${detail.message}` : "图片保存失败，请稍后重试。");
  }
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function safePathSegment(value) {
  return value.normalize("NFKC").replace(/[^\p{L}\p{N}_-]+/gu, "-").replace(/^-+|-+$/g, "") || "unnamed-species";
}

function encodePath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function toBase64(bytes) {
  const values = new Uint8Array(bytes);
  const chunkSize = 0x8000;
  let binary = "";
  for (let offset = 0; offset < values.length; offset += chunkSize) {
    binary += String.fromCharCode(...values.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function json(body, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
