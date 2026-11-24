/* ============================================================
   جزء ۳۰ قرآن کریم — منطق برنامه
   ============================================================ */
"use strict";

/* ---------- ابزار کمکی ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* اعداد فارسی */
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
function toFa(num) {
  return String(num).replace(/\d/g, (d) => FA_DIGITS[+d]);
}

/* شافل (فیشر-یتس) */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ---- یکسان‌سازی متن برای جستجو ----
   برای مقایسهٔ فارسی و عربی، شکل‌های مختلف حروف را به یک شکل برمی‌گردانیم. */
const AR_MAP = {
  "\u0671": "\u0627", "\u0672": "\u0627", "\u0673": "\u0627", "\u0675": "\u0627",
  "\u0622": "\u0627", "\u0623": "\u0627", "\u0625": "\u0627",
  "\u0649": "\u064A", "\u0629": "\u0647",
};
const FA_MAP = {
  "\u064A": "\u06CC", "\u0649": "\u06CC", "\u0643": "\u06A9", "\u0629": "\u0647",
  "\u200C": " ",
};
const AR_DROP = /[\u064B-\u0652\u0670\u0640\u06D6-\u06ED]/g;

/** نرمال‌سازی «حرف‌به‌حرف» با نگه‌داشتن نقشهٔ اندیس‌ها (برای هایلایت درست) */
function normalizeWithMap(str, mode) {
  let out = "";
  const map = [];
  for (let i = 0; i < str.length; i++) {
    let ch = str[i];
    if (mode === "ar" && AR_DROP.test(ch)) { AR_DROP.lastIndex = 0; continue; }
    AR_DROP.lastIndex = 0;
    const table = mode === "ar" ? AR_MAP : FA_MAP;
    if (table[ch]) ch = table[ch];
    if (mode === "fa") ch = ch.toLowerCase();
    out += ch;
    map.push(i);
  }
  return { text: out, map };
}

function normalizeFa(str) {
  return normalizeWithMap(str, "fa").text;
}

function stripDiacritics(str) {
  return normalizeWithMap(str, "ar").text;
}

function normalizeFa(str) {
  return str
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[ىي]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ")
    .toLowerCase();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

/* هایلایت عبارت جستجو (با نقشهٔ اندیس تا متن اصلی دست‌نخورده بماند) */
function highlight(text, query, mode) {
  if (!query) return escapeHtml(text);
  const hay = normalizeWithMap(text, mode);
  const needle = mode === "ar" ? stripDiacritics(query) : normalizeFa(query);
  if (!needle) return escapeHtml(text);

  const pos = hay.text.indexOf(needle);
  if (pos === -1) return escapeHtml(text);

  const start = hay.map[pos];
  const lastIdx = pos + needle.length - 1;
  // انتهای بازه: آخرین کاراکتر نگاشت‌شده + یک
  const end = hay.map[lastIdx] + 1;

  return (
    escapeHtml(text.slice(0, start)) +
    "<mark>" + escapeHtml(text.slice(start, end)) + "</mark>" +
    escapeHtml(text.slice(end))
  );
}

/* ---------- ذخیره‌سازی پیشرفت ---------- */
const LS_KEY = "juz30-progress-v1";

function defaultProgress() {
  return {
    learned: [],      // شناسهٔ آیات حفظ‌شده
    weak: [],         // شناسهٔ آیات نیازمند تمرین
    quizResults: [],  // { date, scope, total, correct }
    streak: 0,
    lastStudyDate: null,
    settings: { showFa: true, reciter: "ar.alafasy" }
  };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return defaultProgress();
    const data = JSON.parse(raw);
    const base = defaultProgress();
    const merged = Object.assign(base, data);
    merged.settings = Object.assign(base.settings, data.settings || {});
    return merged;
  } catch (e) {
    return defaultProgress();
  }
}

let progress = loadProgress();

function saveProgress() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(progress));
  } catch (e) { /* ignore */ }
}

/* استریک روزانه */
function updateStreak() {
  const today = new Date().toDateString();
  if (progress.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    progress.streak = progress.lastStudyDate === yesterday ? progress.streak + 1 : 1;
    progress.lastStudyDate = today;
    saveProgress();
  }
}

/* ---------- دسترسی به داده ---------- */
const TOTAL_AYAHS = AYAH_COUNT;

function surahById(id) {
  return SURAHS.find((s) => s.id === id);
}

function ayahsOfSurah(surahId) {
  const s = surahById(surahId);
  return s ? s.ayahs.map((a) => ({ ...a, surahId: s.id })) : [];
}

function ayahById(id) {
  return AYAHS.find((a) => a.id === id);
}

function isLearned(id) { return progress.learned.includes(id); }
function isWeak(id) { return progress.weak.includes(id); }

function markLearned(id, on) {
  const has = progress.learned.includes(id);
  if (on && !has) {
    progress.learned.push(id);
    progress.weak = progress.weak.filter((x) => x !== id);
  } else if (!on && has) {
    progress.learned = progress.learned.filter((x) => x !== id);
  }
  saveProgress();
  syncProgressUI();
}

function markWeak(id, on) {
  const has = progress.weak.includes(id);
  if (on && !has) {
    progress.weak.push(id);
    progress.learned = progress.learned.filter((x) => x !== id);
  } else if (!on && has) {
    progress.weak = progress.weak.filter((x) => x !== id);
  }
  saveProgress();
  syncProgressUI();
}

function learnedCountIn(surahId) {
  return ayahsOfSurah(surahId).filter((a) => isLearned(a.id)).length;
}

function pctOf(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

/* ---------- تلاوت صوتی ---------- */
const AUDIO_BASE = "https://cdn.islamic.network/quran/audio";

/** وضعیت پخش: یا یک آیهٔ تنها، یا یک صف پیوسته */
const audioState = {
  el: null,
  queue: [],        // آرایهٔ آیات برای پخش پیوسته (خالی = پخش تک‌آیه)
  index: 0,
  current: null,    // آیهٔ در حال پخش
  errorShown: false
};

function ayahAudioUrl(ayah, reciter, quality = 128) {
  return `${AUDIO_BASE}/${quality}/${reciter}/${ayah.g}.mp3`;
}

function audioEl() {
  if (!audioState.el) audioState.el = $("#audioEl");
  return audioState.el;
}

function setAudioBar(title) {
  $("#audioTitle").textContent = title;
  $("#audioBar").hidden = false;
}

function resetAudioBar() {
  $("#audioBar").hidden = true;
  $("#audioFill").style.width = "0%";
  $("#audioToggle").textContent = "▶";
}

function updateAudioToggle() {
  $("#audioToggle").textContent = audioEl().paused ? "▶" : "⏸";
}

function highlightAyah(id, scrollIntoView) {
  $$(".ayah-item.playing").forEach((el) => el.classList.remove("playing"));
  const el = $(`.ayah-item[data-id="${id}"]`);
  if (!el) return;
  el.classList.add("playing");
  if (scrollIntoView) {
    const top = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

function currentReciter() {
  return progress.settings.reciter || "ar.alafasy";
}

/** بارگذاری و پخش یک آیه با عنوان مشخص */
function loadAndPlay(ayah, title, scrollIntoView) {
  audioState.current = ayah;
  audioState.errorShown = false;
  setAudioBar(title);
  const el = audioEl();
  el.src = ayahAudioUrl(ayah, currentReciter());
  highlightAyah(ayah.id, scrollIntoView);
  const p = el.play();
  if (p && typeof p.catch === "function") {
    p.catch(() => {
      if (!audioState.errorShown) {
        audioState.errorShown = true;
        $("#audioTitle").textContent = "تلاوت در دسترس نیست (اتصال اینترنت لازم است)";
      }
    });
  }
}

/** پخش یک آیهٔ تنها (صف پاک می‌شود) */
function playAyah(ayah) {
  if (!ayah) return;
  audioState.queue = [];
  audioState.index = 0;
  loadAndPlay(ayah, `سورهٔ ${ayah.surahFa} — آیهٔ ${toFa(ayah.n)}`, true);
}

/** پخش پیوستهٔ یک فهرست از آیات */
function playSequence(list, startIndex = 0) {
  if (!list || !list.length) return;
  audioState.queue = list.slice();
  audioState.index = Math.max(0, Math.min(startIndex, list.length - 1));
  playQueueStep();
}

function playQueueStep() {
  const ayah = audioState.queue[audioState.index];
  if (!ayah) {
    audioState.queue = [];
    resetAudioBar();
    return;
  }
  loadAndPlay(
    ayah,
    `پخش پیوسته — سورهٔ ${ayah.surahFa} آیهٔ ${toFa(ayah.n)} (${toFa(audioState.index + 1)}/${toFa(audioState.queue.length)})`,
    true
  );
}

function initAudio() {
  const el = audioEl();

  el.addEventListener("timeupdate", () => {
    if (!el.duration || !isFinite(el.duration)) return;
    const p = (el.currentTime / el.duration) * 100;
    $("#audioFill").style.width = Math.min(100, p) + "%";
  });

  el.addEventListener("play", updateAudioToggle);
  el.addEventListener("pause", updateAudioToggle);
  el.addEventListener("error", updateAudioToggle);

  el.addEventListener("ended", () => {
    const hasNext = audioState.queue.length && audioState.index < audioState.queue.length - 1;
    if (hasNext) {
      audioState.index += 1;
      playQueueStep();
    } else {
      audioState.queue = [];
      audioState.current = null;
      $$(".ayah-item.playing").forEach((node) => node.classList.remove("playing"));
      setTimeout(() => { if (el.paused) resetAudioBar(); }, 400);
    }
  });

  $("#audioToggle").addEventListener("click", () => {
    if (!el.src) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  });

  $("#audioClose").addEventListener("click", () => {
    el.pause();
    el.removeAttribute("src");
    audioState.queue = [];
    audioState.current = null;
    $$(".ayah-item.playing").forEach((node) => node.classList.remove("playing"));
    resetAudioBar();
  });
}

/* ---------- ناوبری (SPA) ---------- */
const VIEWS = ["home", "surahs", "surah", "flashcards", "quiz", "search"];
let currentView = "home";
let currentSurahId = SURAHS[0].id;

function showView(name) {
  currentView = name;
  VIEWS.forEach((v) => {
    const el = $("#view-" + v);
    if (el) el.hidden = v !== name;
  });
  $$(".nav-item").forEach((btn) => {
    const nav = btn.dataset.nav;
    const match =
      nav === name ||
      (nav === "flashcards" && name === "flashcards") ||
      (nav === "surahs" && (name === "surah" || name === "surahs"));
    btn.classList.toggle("active", match);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
  $("#navToggle").classList.remove("open");
  $("#navToggle").setAttribute("aria-expanded", "false");
  $(".main-nav").classList.remove("open");
}

function openSurah(id) {
  currentSurahId = id;
  renderSurah(id);
  showView("surah");
}

/* ---------- هدر ---------- */
function syncProgressUI() {
  const total = TOTAL_AYAHS;
  const done = progress.learned.length;
  const pct = pctOf(done, total);

  $("#ringFg").style.strokeDashoffset = String(97.4 - (97.4 * pct) / 100);
  $("#headerPct").textContent = toFa(pct) + "٪";

  const st = $("#statTotal"); if (st) st.textContent = toFa(total);
  const sl = $("#statLearned"); if (sl) sl.textContent = toFa(done);
  const sp = $("#statPct"); if (sp) sp.textContent = toFa(pct) + "٪";
  const ss = $("#statStreak"); if (ss) ss.textContent = toFa(progress.streak || 0);

  // فهرست‌های باز
  if (currentView === "home") renderHomeSurahs();
  if (currentView === "surahs") renderSurahGrid();
  if (currentView === "surah") updateSurahProgress();
}

/* ---------- صفحهٔ خانه ---------- */
function renderHomeSurahs() {
  const grid = $("#homeSurahGrid");
  if (!grid) return;
  grid.innerHTML = SURAHS.map(surahCardHtml).join("");
  $$(".surah-card", grid).forEach((card) => {
    card.addEventListener("click", () => openSurah(+card.dataset.id));
  });
}

function surahCardHtml(s) {
  const done = learnedCountIn(s.id);
  const pct = pctOf(done, s.total);
  const isDone = done === s.total;
  return `
    <button class="surah-card ${isDone ? "done" : ""}" data-id="${s.id}">
      ${isDone ? '<span class="surah-done-badge">✅</span>' : ""}
      <div class="surah-card-top">
        <span class="surah-num">${toFa(s.number)}</span>
        <span class="surah-names">
          <strong>${escapeHtml(s.faName)}</strong>
          <small>${escapeHtml(s.faDesc)}</small>
        </span>
        <span class="surah-card-ar">${escapeHtml(s.name)}</span>
      </div>
      <div class="surah-card-meta">
        <span>${toFa(s.total)} آیه</span>
        <span>•</span>
        <span>${done === 0 ? "شروع نشده" : toFa(done) + " از " + toFa(s.total)}</span>
      </div>
      <div class="surah-mini-bar"><span style="width:${pct}%"></span></div>
    </button>`;
}

/* آیهٔ امروز — بر اساس شمارهٔ روز، پایدار در طول روز */
function renderDailyAyah() {
  const dayIndex = Math.floor(Date.now() / 86400000);
  const ayah = AYAHS[dayIndex % AYAHS.length];
  if (!ayah) return;

  $("#dailyRef").textContent = `سورهٔ ${ayah.surahFa} • آیهٔ ${toFa(ayah.n)}`;
  $("#dailyAr").textContent = ayah.ar;
  $("#dailyFa").textContent = ayah.fa;

  $("#dailyPlay").onclick = () => playAyah(ayah);
  $("#dailyOpen").onclick = () => openSurah(ayah.surahId);
}

/* ---------- فهرست سوره‌ها ---------- */
let surahFilterMode = "all";
let surahFilterText = "";

function renderSurahGrid() {
  const grid = $("#surahGrid");
  if (!grid) return;

  const q = normalizeFa(surahFilterText.trim());
  const list = SURAHS.filter((s) => {
    if (q) {
      const hay = normalizeFa(s.faName + " " + s.faDesc + " " + s.englishName + " " + s.number);
      if (!hay.includes(q)) return false;
    }
    if (surahFilterMode === "todo") return learnedCountIn(s.id) < s.total;
    if (surahFilterMode === "done") return learnedCountIn(s.id) === s.total;
    return true;
  });

  grid.innerHTML = list.length
    ? list.map(surahCardHtml).join("")
    : `<p class="search-meta">سوره‌ای با این مشخصات پیدا نشد.</p>`;

  $$(".surah-card", grid).forEach((card) => {
    card.addEventListener("click", () => openSurah(+card.dataset.id));
  });
}

/* ---------- صفحهٔ سوره ---------- */
function renderSurah(id) {
  const s = surahById(id);
  if (!s) return;

  $("#surahOrder").textContent = toFa(s.number);
  $("#surahTitle").textContent = `سورهٔ ${s.faName}`;
  $("#surahSub").textContent = `${s.faDesc} • ${toFa(s.total)} آیه • ${s.englishName}`;
  $("#surahArName").textContent = s.name;

  const bis = $("#bismillahText");
  bis.hidden = !s.bismillah;
  // سورهٔ توبه بسمله ندارد؛ در جزء ۳۰ همهٔ سوره‌ها به‌جز... بسمله دارند
  if (s.id === 9) bis.hidden = true;

  const list = $("#ayahList");
  list.innerHTML = s.ayahs.map((a) => ayahItemHtml(a, s)).join("");

  list.querySelectorAll(".ayah-item").forEach((item) => {
    const aid = +item.dataset.id;

    item.querySelector(".btn-play").addEventListener("click", (e) => {
      e.stopPropagation();
      playAyah(ayahById(aid));
    });

    const btnL = item.querySelector(".btn-learned");
    btnL.addEventListener("click", (e) => {
      e.stopPropagation();
      markLearned(aid, !isLearned(aid));
      item.classList.toggle("learned", isLearned(aid));
      btnL.classList.toggle("on", isLearned(aid));
      btnL.textContent = isLearned(aid) ? "✓" : "○";
      updateSurahProgress();
    });

    // کلیک روی متن عربی برای آشکارشدن (حالت حفظ)
    const arEl = item.querySelector(".ayah-ar");
    arEl.addEventListener("click", () => arEl.classList.toggle("revealed"));
  });

  applyDisplaySettings();
  updateSurahProgress();
}

function ayahItemHtml(a, s) {
  const learned = isLearned(a.id);
  return `
    <article class="ayah-item ${learned ? "learned" : ""}" data-id="${a.id}">
      <div class="ayah-top">
        <span class="ayah-badge">${toFa(a.n)}</span>
        <div class="ayah-tools">
          <button class="icon-btn btn-play" title="تلاوت آیه" aria-label="تلاوت آیه">▶</button>
          <button class="icon-btn btn-learned ${learned ? "on" : ""}" title="علامت‌گذاری به‌عنوان حفظ‌شده" aria-label="حفظ کردم">${learned ? "✓" : "○"}</button>
        </div>
      </div>
      <p class="ayah-ar">${escapeHtml(a.ar)}</p>
      <p class="ayah-fa">${escapeHtml(a.fa)}</p>
    </article>`;
}

function updateSurahProgress() {
  const s = surahById(currentSurahId);
  if (!s) return;
  const done = learnedCountIn(s.id);
  const pct = pctOf(done, s.total);
  $("#surahBar").style.width = pct + "%";
  $("#surahProgressText").textContent = `${toFa(done)} از ${toFa(s.total)} آیه`;
}

function applyDisplaySettings() {
  const main = $("#view-surah");
  if (!main) return;
  main.classList.toggle("hide-fa", !progress.settings.showFa);
  $("#btnShowFa").classList.toggle("active", progress.settings.showFa);
  $("#btnShowFa").setAttribute("aria-pressed", String(progress.settings.showFa));
}

/* ---------- فلش‌کارت ---------- */
let fcList = [];
let fcIndex = 0;
let fcSeq = [];
let fcFlipped = false;

function populateFcSurahs() {
  const sel = $("#fcSurah");
  sel.innerHTML =
    `<option value="all">همهٔ جزء ۳۰</option>` +
    SURAHS.map((s) => `<option value="${s.id}">سورهٔ ${escapeHtml(s.faName)} (${toFa(s.total)} آیه)</option>`).join("");
}

function buildFcList() {
  const scope = $("#fcSurah").value;
  const only = $("#fcOnly").value;
  const order = $("#fcOrder").value;

  let list = scope === "all" ? AYAHS.slice() : ayahsOfSurah(+scope);

  if (only === "weak") list = list.filter((a) => isWeak(a.id));
  else if (only === "new") list = list.filter((a) => !isLearned(a.id));

  if (order === "shuffle") list = shuffle(list);
  return list;
}

function startFlashcards() {
  fcList = buildFcList();
  fcSeq = fcList.slice();
  fcIndex = 0;

  if (!fcList.length) {
    $("#fcArea").hidden = true;
    $("#fcEmpty").hidden = false;
    $("#fcEmpty").querySelector("p").textContent =
      "آیه‌ای با این فیلتر پیدا نشد. فیلتر را تغییر دهید.";
    return;
  }

  $("#fcEmpty").hidden = true;
  $("#fcArea").hidden = false;
  renderFcCard();
}

function renderFcCard() {
  const a = fcList[fcIndex];
  if (!a) return;
  fcFlipped = false;
  $("#fcCard").classList.remove("flipped");

  const ref = `سورهٔ ${a.surahFa} • آیهٔ ${toFa(a.n)}`;
  $("#fcRef").textContent = ref;
  $("#fcAr").textContent = a.ar;
  $("#fcFa").textContent = a.fa;
  const ref2 = $("#fcRef2");
  if (ref2) ref2.textContent = ref;
  const ar2 = $("#fcAr2");
  if (ar2) ar2.textContent = a.ar;

  $("#fcCounter").textContent = `${toFa(fcIndex + 1)} / ${toFa(fcList.length)}`;
  $("#fcBar").style.width = (fcIndex / fcList.length) * 100 + "%";
  $("#fcProgressText").textContent = `${toFa(progress.learned.length)} آیه حفظ‌شده از ${toFa(TOTAL_AYAHS)}`;
}

function flipCard() {
  fcFlipped = !fcFlipped;
  $("#fcCard").classList.toggle("flipped", fcFlipped);
}

function fcNext() {
  if (fcIndex < fcList.length - 1) {
    fcIndex += 1;
    renderFcCard();
  } else {
    $("#fcArea").hidden = true;
    $("#fcEmpty").hidden = false;
    $("#fcEmpty").querySelector("p").textContent = "مرور کامل شد! 🎉";
  }
}

function fcPrev() {
  if (fcIndex > 0) {
    fcIndex -= 1;
    renderFcCard();
  }
}

/* ---------- آزمون ---------- */
const QUIZ_LABELS = {
  fa: "معنی کدام گزینه است؟",
  next: "آیهٔ بعد چه می‌گوید؟",
  surah: "این آیه از کدام سوره است؟"
};

let quizItems = [];
let quizIdx = 0;
let quizCorrect = 0;
let quizAnswered = false;
let quizFinished = false;

function populateQuizScopes() {
  const sel = $("#quizScope");
  sel.innerHTML =
    `<option value="all">همهٔ جزء ۳۰</option>` +
    SURAHS.map((s) => `<option value="${s.id}">سورهٔ ${escapeHtml(s.faName)}</option>`).join("");
}

function buildQuizItem(ayah, type) {
  if (type === "fa") {
    const others = shuffle(AYAH_TO_OTHERS(ayah, (a) => a.fa)).slice(0, 3);
    const opts = shuffle([ayah, ...others]).map((a) => a.fa);
    return { type, ayah, question: ayah.ar, options: opts, correct: ayah.fa };
  }
  if (type === "next") {
    const idx = AYAHS.findIndex((a) => a.id === ayah.id);
    const nxt = AYAHS[idx + 1];
    if (!nxt) return null;
    const pool = AYAHS.filter((a) => a.id !== nxt.id && a.surahId === ayah.surahId);
    const others = shuffle(pool.length >= 3 ? pool : AYAHS.filter((a) => a.id !== nxt.id)).slice(0, 3);
    const opts = shuffle([nxt, ...others]).map((a) => a.ar);
    return { type, ayah, question: ayah.ar, options: opts, correct: nxt.ar, nextAyah: nxt };
  }
  // surah
  const correct = ayah.surahFa;
  const others = shuffle(SURAHS.filter((s) => s.id !== ayah.surahId)).slice(0, 3).map((s) => s.faName);
  const opts = shuffle([correct, ...others]);
  return { type, ayah, question: ayah.ar, options: opts, correct };
}

function AYAH_TO_OTHERS(ayah, keyFn) {
  return AYAHS.filter((a) => a.id !== ayah.id && keyFn(a) !== keyFn(ayah));
}

function startQuiz() {
  const scope = $("#quizScope").value;
  const count = +$("#quizCount").value;
  const type = $("#quizType").value;

  const pool = scope === "all" ? AYAHS.slice() : ayahsOfSurah(+scope);
  if (!pool.length) return;

  const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
  const types = ["fa", "next", "surah"];

  quizItems = [];
  for (const a of picked) {
    const t = type === "mix" ? pick(types) : type;
    const item = buildQuizItem(a, t);
    if (item) quizItems.push(item);
  }

  if (!quizItems.length) {
    quizItems = picked.map((a) => buildQuizItem(a, "fa")).filter(Boolean);
  }

  quizIdx = 0;
  quizCorrect = 0;
  quizAnswered = false;
  quizFinished = false;
  $("#quizSetup").hidden = true;
  $("#quizResult").hidden = true;
  $("#quizArea").hidden = false;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const item = quizItems[quizIdx];
  if (!item) return finishQuiz();

  quizAnswered = false;
  $("#quizCounter").textContent = `سؤال ${toFa(quizIdx + 1)} از ${toFa(quizItems.length)}`;
  $("#quizScore").textContent = `امتیاز: ${toFa(quizCorrect)}`;
  $("#quizBar").style.width = (quizIdx / quizItems.length) * 100 + "%";

  $("#quizTypeBadge").textContent = {
    fa: "ترجمهٔ آیه",
    next: "ادامهٔ آیه",
    surah: "سوره‌شناسی"
  }[item.type];

  $("#quizQuestion").textContent = item.question;
  $("#quizHint").textContent = item.nextAyah
    ? `سورهٔ ${item.ayah.surahFa} • آیهٔ ${toFa(item.ayah.n)} — آیهٔ بعدی کدام است؟`
    : `سورهٔ ${item.ayah.surahFa} • آیهٔ ${toFa(item.ayah.n)}`;

  const box = $("#quizOptions");
  box.innerHTML = item.options
    .map(
      (opt, i) => `
      <button class="quiz-option" data-opt="${i}">
        <span class="opt-key">${["۱", "۲", "۳", "۴"][i]}</span>
        <span class="opt-text">${escapeHtml(opt)}</span>
      </button>`
    )
    .join("");

  const keys = ["1", "2", "3", "4"];
  box.querySelectorAll(".quiz-option").forEach((btn, i) => {
    btn.dataset.key = keys[i];
    btn.addEventListener("click", () => answerQuiz(btn, item));
  });

  $("#quizFeedback").hidden = true;
  $("#btnQuizNext").hidden = true;
}

function answerQuiz(btn, item) {
  if (quizAnswered) return;
  quizAnswered = true;

  const chosen = btn.querySelector(".opt-text").textContent;
  const isRight = chosen === item.correct;

  $$("#quizOptions .quiz-option").forEach((b) => {
    b.disabled = true;
    const t = b.querySelector(".opt-text").textContent;
    if (t === item.correct) b.classList.add("correct");
  });

  if (isRight) {
    quizCorrect += 1;
    $("#quizScore").textContent = `امتیاز: ${toFa(quizCorrect)}`;
  } else {
    btn.classList.add("wrong");
    markWeak(item.ayah.id, true);
  }

  const fb = $("#quizFeedback");
  fb.hidden = false;
  $("#quizFeedbackText").innerHTML = isRight
    ? `✅ درست بود!<br><span class="mono">${escapeHtml(item.correct)}</span>`
    : `❌ پاسخ درست: ${escapeHtml(item.correct)}`;

  $("#btnQuizNext").hidden = false;
  $("#btnQuizNext").textContent =
    quizIdx < quizItems.length - 1 ? "سؤال بعدی →" : "پایان آزمون";
}

function finishQuiz() {
  if (quizFinished) return;   // جلوگیری از ثبت چندبارهٔ نتیجه
  quizFinished = true;

  $("#quizArea").hidden = true;
  $("#quizResult").hidden = false;

  const total = quizItems.length;
  const pct = pctOf(quizCorrect, total);

  $("#resultPct").textContent = toFa(pct) + "٪";
  $("#resultRing").style.strokeDashoffset = String(97.4 - (97.4 * pct) / 100);

  const title =
    pct >= 90 ? "ماشاءالله! عالی بود 🌟" :
    pct >= 70 ? "آفرین! نزدیک به کامل ✨" :
    pct >= 50 ? "خوب است، ادامه دهید 💪" :
    "نیاز به تمرین بیشتر دارید — با آرامش تکرار کنید 🌱";

  $("#resultTitle").textContent = title;
  $("#resultText").textContent = `شما به ${toFa(quizCorrect)} سؤال از ${toFa(total)} سؤال پاسخ درست دادید.`;

  progress.quizResults.unshift({
    date: new Date().toISOString(),
    total,
    correct: quizCorrect
  });
  progress.quizResults = progress.quizResults.slice(0, 50);
  saveProgress();
}

/* ---------- جستجو ---------- */
function runSearch() {
  const q = $("#searchInput").value.trim();
  const meta = $("#searchMeta");
  const box = $("#searchResults");

  if (!q || q.length < 1) {
    meta.textContent = "";
    box.innerHTML = "";
    return;
  }

  const nq = normalizeFa(q);
  const normQuery = stripDiacritics(q);

  const results = AYAHS.filter((a) => {
    const inAr = stripDiacritics(a.ar).includes(normQuery);
    const inFa = normalizeFa(a.fa).includes(nq);
    const inSurah = normalizeFa(a.surahFa).includes(nq);
    return inAr || inFa || inSurah;
  });

  meta.textContent = `${toFa(results.length)} نتیجه${results.length ? "" : ""} پیدا شد.`;
  if (!results.length) {
    box.innerHTML = `<p class="search-meta">نتیجه‌ای یافت نشد. املای عبارت را بررسی کنید.</p>`;
    return;
  }

  box.innerHTML = results
    .slice(0, 60)
    .map((a) => {
      const arHtml = highlight(a.ar, q, "ar");
      const faHtml = highlight(a.fa, q, "fa");
      return `
        <div class="search-item" data-id="${a.id}" data-surah="${a.surahId}">
          <span class="search-ref">سورهٔ ${escapeHtml(a.surahFa)} • آیهٔ ${toFa(a.n)}</span>
          <p class="search-ar">${arHtml}</p>
          <p class="search-fa">${faHtml}</p>
        </div>`;
    })
    .join("");

  box.querySelectorAll(".search-item").forEach((el) => {
    el.addEventListener("click", () => {
      openSurah(+el.dataset.surah);
      const target = +el.dataset.id;
      setTimeout(() => {
        const node = $(`.ayah-item[data-id="${target}"]`);
        if (node) {
          const top = node.getBoundingClientRect().top + window.scrollY - 120;
          window.scrollTo({ top, behavior: "smooth" });
          node.style.transition = "box-shadow .4s";
          node.style.boxShadow = "0 0 0 3px rgba(15,118,110,.35)";
          setTimeout(() => (node.style.boxShadow = ""), 1800);
        }
      }, 120);
    });
  });
}

/* ---------- سیم‌کشی رویدادها ---------- */
function wireGlobal() {
  // ناوبری
  $$("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.nav;
      if (target === "home") {
        renderHomeSurahs();
        showView("home");
      } else if (target === "surahs") {
        renderSurahGrid();
        showView("surahs");
      } else if (target === "flashcards") {
        showView("flashcards");
      } else if (target === "quiz") {
        showView("quiz");
      } else if (target === "search") {
        showView("search");
        setTimeout(() => $("#searchInput").focus(), 160);
      }
    });
  });

  // دکمهٔ ادامه
  $("#btnContinue").addEventListener("click", () => {
    // نخستین سوره‌ای که کامل حفظ نشده
    const next = SURAHS.find((s) => learnedCountIn(s.id) < s.total) || SURAHS[0];
    openSurah(next.id);
  });

  // منوی موبایل
  $("#navToggle").addEventListener("click", () => {
    const open = $("#navToggle").classList.toggle("open");
    $("#navToggle").setAttribute("aria-expanded", String(open));
    $(".main-nav").classList.toggle("open", open);
  });

  // فیلتر سوره‌ها
  $("#surahFilter").addEventListener("input", (e) => {
    surahFilterText = e.target.value;
    renderSurahGrid();
  });

  $$("#surahFilterChips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$("#surahFilterChips .chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      surahFilterMode = chip.dataset.filter;
      renderSurahGrid();
    });
  });

  // تنظیمات نمایش سوره
  $("#btnShowFa").addEventListener("click", () => {
    progress.settings.showFa = !progress.settings.showFa;
    saveProgress();
    applyDisplaySettings();
  });

  $("#btnHideAr").addEventListener("click", () => {
    const on = $("#view-surah").classList.toggle("hide-ar");
    $("#btnHideAr").classList.toggle("active", on);
    $("#btnHideAr").setAttribute("aria-pressed", String(on));
    $$(".ayah-ar.revealed").forEach((el) => el.classList.remove("revealed"));
  });

  // قاری
  const recSel = $("#reciterSelect");
  recSel.value = progress.settings.reciter || "ar.alafasy";
  recSel.addEventListener("change", () => {
    progress.settings.reciter = recSel.value;
    saveProgress();
    // اگر در حال پخش است، همان آیه را با قاری جدید از سر بگیر
    const cur = audioState.current;
    if (cur && !audioEl().paused) {
      const inQueue = audioState.queue.length > 0;
      if (inQueue) playQueueStep();
      else playAyah(cur);
    }
  });

  // پخش پیوستهٔ سوره
  $("#btnPlaySurah").addEventListener("click", () => {
    const s = surahById(currentSurahId);
    if (!s) return;
    playSequence(ayahsOfSurah(s.id), 0);
  });

  // علامت‌گذاری همه
  $("#btnMarkAll").addEventListener("click", () => {
    const s = surahById(currentSurahId);
    if (!s) return;
    const allDone = learnedCountIn(s.id) === s.total;
    s.ayahs.forEach((a) => markLearned(a.id, !allDone));
    renderSurah(s.id);
  });

  // فلش‌کارت
  $("#btnStartFc").addEventListener("click", startFlashcards);
  $("#fcCard").addEventListener("click", flipCard);
  $("#fcCard").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flipCard();
    }
  });
  $("#fcNext").addEventListener("click", fcNext);
  $("#fcPrev").addEventListener("click", fcPrev);
  $("#btnEndFc").addEventListener("click", () => {
    $("#fcArea").hidden = true;
    $("#fcEmpty").hidden = false;
    $("#fcEmpty").querySelector("p").textContent = "مرور را پایان دادید.";
  });
  $("#btnFcRestart").addEventListener("click", startFlashcards);

  $("#btnLearned").addEventListener("click", () => {
    const a = fcList[fcIndex];
    if (!a) return;
    markLearned(a.id, true);
    fcNext();
  });

  $("#btnWeak").addEventListener("click", () => {
    const a = fcList[fcIndex];
    if (!a) return;
    markWeak(a.id, true);
    fcNext();
  });

  $("#btnPlayFc").addEventListener("click", () => {
    const a = fcList[fcIndex];
    if (a) playAyah(ayahById(a.id));
  });

  // آزمون
  $("#btnStartQuiz").addEventListener("click", startQuiz);
  $("#btnQuizNext").addEventListener("click", () => {
    if (quizFinished) return;
    quizIdx += 1;
    if (quizIdx >= quizItems.length) {
      $("#btnQuizNext").hidden = true;
      finishQuiz();
    } else {
      renderQuizQuestion();
    }
  });
  $("#btnQuizQuit").addEventListener("click", () => {
    if (quizIdx === 0 && quizCorrect === 0) {
      $("#quizArea").hidden = true;
      $("#quizSetup").hidden = false;
      return;
    }
    finishQuiz();
  });
  $("#btnQuizAgain").addEventListener("click", () => {
    $("#quizResult").hidden = true;
    $("#quizSetup").hidden = false;
  });

  // جستجو
  let searchTimer = null;
  $("#searchInput").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runSearch, 180);
  });

  // پاک‌کردن پیشرفت
  $("#btnResetFooter").addEventListener("click", () => {
    $("#modalBackdrop").hidden = false;
  });
  $("#btnModalCancel").addEventListener("click", () => {
    $("#modalBackdrop").hidden = true;
  });
  $("#btnModalConfirm").addEventListener("click", () => {
    progress = defaultProgress();
    saveProgress();
    $("#modalBackdrop").hidden = true;
    syncProgressUI();
    if (currentView === "surah") renderSurah(currentSurahId);
    if (currentView === "flashcards") {
      $("#fcArea").hidden = true;
      $("#fcEmpty").hidden = true;
    }
  });
  $("#modalBackdrop").addEventListener("click", (e) => {
    if (e.target === $("#modalBackdrop")) $("#modalBackdrop").hidden = true;
  });

  // کلیدهای میان‌بر
  document.addEventListener("keydown", (e) => {
    if (e.target.matches("input, select, textarea")) return;

    if (currentView === "flashcards" && !$("#fcArea").hidden) {
      if (e.key === " ") { e.preventDefault(); flipCard(); }
      if (e.key === "ArrowLeft") fcNext();
      if (e.key === "ArrowRight") fcPrev();
    }

    if (currentView === "quiz" && !$("#quizArea").hidden) {
      const keys = ["1", "2", "3", "4"];
      if (keys.includes(e.key)) {
        const btns = $$("#quizOptions .quiz-option").filter((b) => !b.disabled);
        const idx = keys.indexOf(e.key);
        if (btns[idx]) btns[idx].click();
      }
      if (e.key === "Enter" && !$("#btnQuizNext").hidden) $("#btnQuizNext").click();
    }

    if (e.key === "Escape") {
      if (!$("#modalBackdrop").hidden) $("#modalBackdrop").hidden = true;
    }
  });
}

/* ---------- راه‌اندازی ---------- */
let appStarted = false;

function init() {
  // محافظ: اگر init دو بار صدا زده شود، شنونده‌ها دوباره بسته نمی‌شوند
  // (وگرنه هر کلیک دو بار اجرا می‌شد و اثر هم را خنثی می‌کرد)
  if (appStarted) return;
  appStarted = true;

  updateStreak();
  populateFcSurahs();
  populateQuizScopes();
  initAudio();

  wireGlobal();
  syncProgressUI();
  renderHomeSurahs();
  renderDailyAyah();
  showView("home");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  // اسکریپت بعد از آماده‌شدن DOM بارگذاری شده است
  init();
}
