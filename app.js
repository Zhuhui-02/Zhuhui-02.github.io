const names = ["艾莲娜", "洛因", "赛蕾斯", "凛音", "阿斯特", "米拉", "修", "菲娜", "卡洛", "伊芙"];
const surnames = ["月岚", "白塔", "星坠", "鸢尾", "银钥", "赤炉", "雾港", "烬羽", "苍庭", "黎冠"];

const races = [
  ["人类", "适应力极强，能在混乱年代活得很像主角。"],
  ["森精灵", "寿命漫长，容易被森林、诗歌和麻烦事偏爱。"],
  ["龙裔", "血脉中有古龙残响，生气时周围会变暖。"],
  ["月兔族", "夜间感知敏锐，擅长听见别人没说出口的话。"],
  ["自动人偶", "以魔导核心维持生命，感情会一点点学会发光。"],
  ["鬼族", "体魄强悍，重视誓言、酒宴和正面决斗。"],
  ["海妖", "声音会影响潮汐，也会让谎言变得不稳。"],
  ["史莱姆拟态", "可塑性惊人，身份经常被错误登记。"],
  ["天翼族", "背负羽翼与戒律，天生被高处的风注视。"],
  ["魔族混血", "魔力充沛，却常被旧王国的偏见缠上。"],
];

const origins = [
  "边境药师的养子",
  "地下竞技场逃出的新人",
  "没落贵族家的第七继承人",
  "图书迷宫的临时管理员",
  "港口占星师捡到的孤儿",
  "魔王城厨房的见习工",
  "龙墓巡礼团的记录员",
  "被圣堂登记错误的勇者候补",
];

const callings = [
  ["符文剑士", "用剑切开敌意，再用符文把麻烦封回去。", { strength: 2, mana: 1 }],
  ["星图术师", "从星座里读路线，也从沉默里读谎话。", { intellect: 2, luck: 1 }],
  ["契约召唤师", "擅长与难缠存在谈条件，包括自己。", { charm: 2, mana: 1 }],
  ["遗物鉴定家", "能分辨古董、诅咒和老板开的低价。", { intellect: 2, charm: 1 }],
  ["战地厨师", "用一口锅维持队伍士气，也能敲晕敌人。", { strength: 1, charm: 1, luck: 1 }],
  ["迷宫建筑师", "懂得迷宫如何吞人，因此也懂得如何逃出来。", { intellect: 1, agility: 1, mana: 1 }],
  ["影步斥候", "在灯火照不到的地方，把情报带回清晨。", { agility: 2, luck: 1 }],
  ["圣歌修补匠", "替破碎结界补上最后一个音节。", { mana: 2, charm: 1 }],
];

const hair = ["银白长发", "黑曜短发", "樱粉卷发", "深蓝马尾", "金色碎发", "薄荷色发尾"];
const eyes = ["琥珀眼", "冰蓝眼", "异色瞳", "翡翠眼", "紫晶眼", "暗红眼"];
const marks = ["锁骨处有星形印记", "手背刻着古代编号", "耳后浮现金色鳞纹", "额角有月牙般的微光", "影子偶尔慢半拍"];
const aura = ["周身带着雨后草木香", "说话时空气像被烛火照亮", "靠近时能听见微弱钟声", "情绪波动会落下细小光尘", "脚步声像翻页"];

const talents = [
  ["天赋", "万象翻译", "能读懂大多数古代文字，但菜单也会被读得像预言。"],
  ["天赋", "低阶魔法暴击", "越简单的法术，越可能出现离谱效果。"],
  ["天赋", "迷宫嗅觉", "能直觉找到隐藏房间，也常误入厨房。"],
  ["天赋", "王器亲和", "传说级遗物愿意听你解释三分钟。"],
  ["天赋", "灵魂账本", "能看见承诺的重量，适合谈判和讨债。"],
];

const blessings = [
  ["祝福", "晨星庇护", "每天第一次失败会变成一次微妙提示。"],
  ["祝福", "旅店之缘", "在陌生城镇总能找到愿意收留你的人。"],
  ["祝福", "风的偏爱", "移动、闪避与逃跑时格外体面。"],
  ["祝福", "丰穰餐桌", "做出的食物能缓慢恢复同行者的心气。"],
];

const curses = [
  ["诅咒", "迟到的神谕", "关键提示总会晚来一小会儿。"],
  ["诅咒", "史诗误会", "越认真解释，旁人越觉得你深不可测。"],
  ["诅咒", "满月眩晕", "满月夜魔力增强，但方向感短暂离席。"],
  ["诅咒", "宝箱偏见", "稀有宝箱总先给你生活用品。"],
];

const stats = [
  ["strength", "筋力"],
  ["agility", "敏捷"],
  ["intellect", "智识"],
  ["mana", "魔力"],
  ["charm", "魅力"],
  ["luck", "幸运"],
];

const BASE_STAT = 4;
const MAX_STAT = 18;
const FULL_BUILD_CHANCE = 0.08;

const contractTexts = [
  "星门会取走你旧世界的一点惯性。你仍是你，但醒来时，常识未必还站在你这边。",
  "新的身体、出身与运气不会完全公平。命运只负责发牌，不负责教人如何漂亮地打出去。",
  "一旦签下契约，水晶球将为你显现另一段人生。请确认：你愿意让故事开始。",
];

const state = {
  page: "contract",
  modalMode: "contract",
  modalIndex: 0,
  profile: null,
  pointPool: 0,
  pointsLeft: 0,
  selectedCallingIndex: 0,
};

const $ = (selector) => document.querySelector(selector);

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function rollPointPool() {
  if (Math.random() < FULL_BUILD_CHANCE) {
    return stats.length * MAX_STAT;
  }

  return 40 + Math.floor(Math.random() * 63);
}

function sumStats(ability = state.profile?.ability || {}) {
  return Object.values(ability).reduce((sum, value) => sum + value, 0);
}

function getCallingBonus(callingIndex = state.selectedCallingIndex) {
  return callings[callingIndex]?.[2] || {};
}

function getMinimumStats(callingIndex = state.selectedCallingIndex) {
  const bonus = getCallingBonus(callingIndex);
  return Object.fromEntries(stats.map(([key]) => [key, BASE_STAT + (bonus[key] || 0)]));
}

function getStatMinimum(key) {
  return getMinimumStats()[key];
}

function getStatMaximum(key) {
  return MAX_STAT;
}

function syncPointsLeft() {
  state.pointsLeft = state.pointPool - sumStats();
}

function createIdentity(previous = {}) {
  const race = previous.race || pick(races);
  const origin = previous.origin || pick(origins);
  return {
    name: previous.name || `${pick(surnames)} ${pick(names)}`,
    race,
    origin,
    appearance:
      previous.appearance || `${pick(hair)}，${pick(eyes)}，${pick(marks)}，${pick(aura)}`,
    tags: previous.tags || [pick(talents), pick(blessings), pick(curses)],
  };
}

function createProfile(options = {}) {
  const previous = state.profile || {};
  const identity = createIdentity({
    name: options.keepName ? previous.name : undefined,
    race: options.keepRace ? previous.race : undefined,
    origin: options.keepOrigin ? previous.origin : undefined,
    appearance: options.keepAppearance ? previous.appearance : undefined,
    tags: options.keepTags ? previous.tags : undefined,
  });

  const ability = options.keepStats && previous.ability ? { ...previous.ability } : createBaseStats();
  const calling = callings[state.selectedCallingIndex] || callings[0];
  const total = sumStats(ability);

  return {
    ...identity,
    calling: calling[0],
    callingDescription: calling[1],
    title: `${identity.race[0]} · ${calling[0]}`,
    ability,
    total,
    seed: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
  };
}

function createBaseStats() {
  return getMinimumStats();
}

function startWeaving() {
  state.pointPool = rollPointPool();
  state.selectedCallingIndex = Math.floor(Math.random() * callings.length);
  state.profile = createProfile();
  syncPointsLeft();
  refreshProfile();
  showPage("weave");
  renderAll();
}

function resetAbilityForCalling() {
  state.profile.ability = createBaseStats();
  syncPointsLeft();
  refreshProfile();
}

function changeCalling(nextIndex) {
  const oldMinimums = getMinimumStats();
  const extras = Object.fromEntries(
    stats.map(([key]) => [key, Math.max(0, state.profile.ability[key] - oldMinimums[key])]),
  );

  state.selectedCallingIndex = nextIndex;
  const newMinimums = getMinimumStats();
  state.profile.ability = Object.fromEntries(
    stats.map(([key]) => [key, newMinimums[key] + extras[key]]),
  );
  syncPointsLeft();
  refreshProfile();
}

function refreshProfile() {
  state.profile.total = sumStats();
  state.profile.calling = callings[state.selectedCallingIndex][0];
  state.profile.callingDescription = callings[state.selectedCallingIndex][1];
  state.profile.title = `${state.profile.race[0]} · ${state.profile.calling}`;
}

function showPage(page) {
  state.page = page;
  document.querySelectorAll("[data-page]").forEach((section) => {
    section.classList.toggle("active", section.dataset.page === page);
  });
  document.querySelectorAll("[data-step-pill]").forEach((pill) => {
    pill.classList.toggle("active", pill.dataset.stepPill === page);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAll() {
  renderProfile();
  renderCallings();
  renderStats();
  renderTags();
  renderSummary();
  drawSigil(state.profile);
}

function renderProfile() {
  const profile = state.profile;
  $("#hero-name").textContent = profile.name;
  $("#hero-title").textContent = profile.title;
  $("#race").textContent = `${profile.race[0]}：${profile.race[1]}`;
  $("#origin").textContent = profile.origin;
  $("#appearance").textContent = profile.appearance;
}

function renderCallings() {
  $("#calling-options").innerHTML = callings
    .map(
      ([name, description], index) => `
        <button class="calling-option ${index === state.selectedCallingIndex ? "selected" : ""}" data-calling="${index}" type="button">
          <strong>${name}</strong>
          <span>${description}</span>
        </button>
      `,
    )
    .join("");

  document.querySelectorAll("[data-calling]").forEach((button) => {
    button.addEventListener("click", () => {
      changeCalling(Number(button.dataset.calling));
      renderAll();
    });
  });
}

function renderStats() {
  $("#point-pool").textContent = state.pointPool;
  $("#points-left").textContent = state.pointsLeft;
  $("#weave-note").textContent =
    state.pointsLeft === 0
      ? "命盘已经填满。水晶球正在等待你的最后一步。"
      : state.pointPool >= stats.length * MAX_STAT
        ? "罕见的满月命盘。今天，星门格外慷慨。"
      : `还剩 ${state.pointsLeft} 点未分配。`;

  $("#stat-editor").innerHTML = stats
    .map(([key, label]) => {
      const value = state.profile.ability[key];
      const min = getStatMinimum(key);
      const absoluteMax = getStatMaximum(key);
      const meterValue = ((value - min) / Math.max(1, absoluteMax - min)) * 100;
      return `
        <article class="stat-row">
          <div class="stat-top">
            <span class="stat-name">${label}</span>
            <span class="stat-value">${value}</span>
          </div>
          <div class="stat-controls">
            <button class="step-button" data-stat="${key}" data-delta="-1" type="button" aria-label="减少${label}">-</button>
            <label class="slider-shell">
              <input
                class="stat-slider"
                data-stat-range="${key}"
                type="range"
                min="${min}"
                max="${absoluteMax}"
                value="${value}"
                style="--value: ${Math.max(0, Math.min(meterValue, 100))}%"
                aria-label="调整${label}"
              />
            </label>
            <button class="step-button" data-stat="${key}" data-delta="1" type="button" aria-label="增加${label}">+</button>
          </div>
          <div class="stat-hint">下限 ${min} · 命盘上限 ${absoluteMax}</div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-stat]").forEach((button) => {
    button.addEventListener("click", () => {
      adjustStat(button.dataset.stat, Number(button.dataset.delta));
    });
  });

  document.querySelectorAll("[data-stat-range]").forEach((input) => {
    input.addEventListener("input", () => {
      setStat(input.dataset.statRange, Number(input.value));
    });
  });
}

function adjustStat(key, delta) {
  const current = state.profile.ability[key];
  if (delta > 0 && state.pointsLeft <= 0) return;
  if (delta > 0 && current >= getStatMaximum(key)) return;
  if (delta < 0 && current <= getStatMinimum(key)) return;

  state.profile.ability[key] = current + delta;
  syncPointsLeft();
  refreshProfile();
  renderStats();
  renderProfile();
  drawSigil(state.profile);
}

function setStat(key, nextValue) {
  const current = state.profile.ability[key];
  const min = getStatMinimum(key);
  const max = Math.min(getStatMaximum(key), current + state.pointsLeft);
  const value = Math.max(min, Math.min(max, nextValue));
  if (value === current) {
    renderStats();
    return;
  }

  state.profile.ability[key] = value;
  syncPointsLeft();
  refreshProfile();
  renderStats();
  renderProfile();
  drawSigil(state.profile);
}

function renderTags() {
  $("#tag-board").innerHTML = state.profile.tags
    .map(
      ([type, name, description]) => `
        <article class="fate-tag">
          <strong>${type} · ${name}</strong>
          <span>${description}</span>
        </article>
      `,
    )
    .join("");
}

function renderSummary() {
  if (!state.profile) return;
  const entries = [
    ["姓名", state.profile.name],
    ["种族", state.profile.race[0]],
    ["出身", state.profile.origin],
    ["职业", state.profile.calling],
    ["相貌", state.profile.appearance],
    ["能力合计", String(state.profile.total)],
  ];

  $("#summary-list").innerHTML = entries
    .map(
      ([label, value]) => `
        <div>
          <dt>${label}</dt>
          <dd>${value}</dd>
        </div>
      `,
    )
    .join("");
}

function drawSigil(profile) {
  const canvas = $("#sigil");
  const context = canvas.getContext("2d");
  const size = canvas.width;
  const center = size / 2;

  context.clearRect(0, 0, size, size);
  context.save();
  context.translate(center, center);

  const colors = ["#e8b956", "#d8746f", "#68c39b", "#78a5e8", "#a88be8"];
  const chartCap = Math.max(...stats.map(([key]) => getStatMaximum(key)), 16);
  for (let ring = 0; ring < 5; ring += 1) {
    context.beginPath();
    context.strokeStyle = colors[ring];
    context.globalAlpha = 0.24 + ring * 0.08;
    context.lineWidth = ring === 0 ? 4 : 2;
    context.arc(0, 0, 138 - ring * 22, 0, Math.PI * 2);
    context.stroke();
  }

  const points = stats.map(([key], index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / stats.length;
    const radius = 38 + (profile.ability[key] / chartCap) * 100;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });

  context.globalAlpha = 0.9;
  context.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
  context.fillStyle = "rgba(232, 185, 86, 0.16)";
  context.strokeStyle = "#e8b956";
  context.lineWidth = 3;
  context.fill();
  context.stroke();

  points.forEach(([x, y], index) => {
    context.beginPath();
    context.fillStyle = colors[index % colors.length];
    context.arc(x, y, 6, 0, Math.PI * 2);
    context.fill();
  });

  context.globalAlpha = 0.92;
  context.fillStyle = "#f5efe3";
  context.font = "700 28px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(String(profile.total), 0, 0);
  context.restore();
}

function openContractModal(startIndex = 0) {
  state.modalMode = "contract";
  state.modalIndex = startIndex;
  $("#contract-modal").hidden = false;
  renderModal();
}

function openCostModal() {
  state.modalMode = "cost";
  $("#contract-modal").hidden = false;
  $("#modal-step").textContent = "星门告示";
  $("#modal-title").textContent = "契约代价";
  $("#modal-copy").textContent =
    "星门只负责重塑命盘，不保证你成为勇者。点数可以重掷，种族、出身、相貌和命运刻痕也可以重新抽取；但一旦走到水晶球前，预言会以当时的命盘为准。";
  $("#modal-cancel").textContent = "关闭";
  $("#modal-confirm").textContent = "我明白了";
}

function renderModal() {
  const index = state.modalIndex;
  $("#modal-title").textContent = "契约确认";
  $("#modal-step").textContent = `确认 ${index + 1} / ${contractTexts.length}`;
  $("#modal-copy").textContent = contractTexts[index];
  $("#modal-cancel").textContent = "暂不转生";
  $("#modal-confirm").textContent = index === contractTexts.length - 1 ? "签下契约" : "继续确认";
}

function closeContractModal() {
  $("#contract-modal").hidden = true;
}

function formatBiography(text) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.trim()}</p>`)
    .join("");
}

async function generateBiography() {
  const output = $("#bio-output");
  output.innerHTML = `<p class="loading">水晶球里有雾光升起，正在寻找与你相连的那条命运线...</p>`;

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile: state.profile }),
    });

    if (!response.ok) throw new Error(`request failed: ${response.status}`);

    const data = await response.json();
    output.innerHTML = formatBiography(data.biography);
  } catch (error) {
    output.innerHTML = formatBiography(localBiography(state.profile));
  }
}

function localBiography(profile) {
  const [, talentName] = profile.tags[0];
  const [, blessingName] = profile.tags[1];
  const [, curseName] = profile.tags[2];

  return `${profile.name} 在另一侧醒来时，鼻尖先闻到潮湿石墙与药草灰的气味。记录员把这个新生者登记为${profile.race[0]}，出身写作「${profile.origin}」。那天窗外有钟声，屋里的人都以为只是普通的转生，可水盆里的倒影却映出${profile.appearance}，像某个旧传说忽然翻到了下一页。

少年时期的 ${profile.name} 并不擅长安分。选择成为「${profile.calling}」后，${profile.callingDescription}。天赋「${talentName}」第一次显现，是在一场本该失败的试炼里；祝福「${blessingName}」替这次冒险留住了最后一点余地，也让旁人开始相信，这个名字迟早会被写进边境酒馆的墙上。

只是命运从不白送礼物。诅咒「${curseName}」像细线一样缠在旅途边缘，让每次胜利都带着新的麻烦。当能力合计达到 ${profile.total}，星门在北境迷宫深处再次发亮。没人知道那道光是在召唤勇者、怪物，还是一个终于准备好面对前世的人。`;
}

$("#begin-contract").addEventListener("click", () => openContractModal());
$("#peek-rules").addEventListener("click", openCostModal);

$("#modal-cancel").addEventListener("click", closeContractModal);
$("#modal-confirm").addEventListener("click", () => {
  if (state.modalMode === "cost") {
    closeContractModal();
    return;
  }

  if (state.modalIndex < contractTexts.length - 1) {
    state.modalIndex += 1;
    renderModal();
    return;
  }

  closeContractModal();
  startWeaving();
});

$("#reroll-identity").addEventListener("click", () => {
  state.profile = createProfile({
    keepName: true,
    keepAppearance: true,
    keepTags: true,
    keepStats: true,
  });
  refreshProfile();
  renderAll();
});

$("#reroll-appearance").addEventListener("click", () => {
  state.profile = createProfile({
    keepName: true,
    keepRace: true,
    keepOrigin: true,
    keepTags: true,
    keepStats: true,
  });
  refreshProfile();
  renderAll();
});

$("#reroll-points").addEventListener("click", () => {
  state.pointPool = rollPointPool();
  resetAbilityForCalling();
  renderAll();
});

$("#reroll-tags").addEventListener("click", () => {
  state.profile.tags = [pick(talents), pick(blessings), pick(curses)];
  renderTags();
});

$("#to-oracle").addEventListener("click", () => {
  if (state.pointsLeft !== 0) {
    $("#weave-note").textContent = "点数还没有分配完。别让命运替你把剩下的部分随手塞进幸运里。";
    return;
  }

  refreshProfile();
  renderSummary();
  showPage("oracle");
});

$("#back-to-weave").addEventListener("click", () => showPage("weave"));
$("#generate-bio").addEventListener("click", generateBiography);
