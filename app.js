/* ============================================================
   ۵۰۴ واژه ضروری انگلیسی — منطق برنامه
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

/* مرتب‌سازی شافل (فیشر-یتس) */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- ذخیره‌سازی پیشرفت (localStorage) ---------- */
const LS_KEY = "vocab504-progress-v1";

function defaultProgress() {
  return {
    learned: [],      // id کلمه‌های یادگرفته‌شده
    weak: [],         // id کلمه‌های نیازمند تمرین
    quizResults: [],  // نتایج آزمون‌ها { date, scopeLesson, total, correct }
    streak: 0,
    lastStudyDate: null
  };
}

/* کاربر در حال ورود (بعد از ورود یا ورود خودکار) */
let currentUser = null;
let progress = loadProgress();

/* کلید پیشرفت هر کاربر: LS_KEY_<id کاربر> */
function progressKey(userId) {
  return LS_KEY + "_" + userId;
}

function loadProgress() {
  const uid = currentUser ? currentUser.id : "";
  try {
    const raw = localStorage.getItem(progressKey(uid));
    if (!raw) return defaultProgress();
    const data = JSON.parse(raw);
    return Object.assign(defaultProgress(), data);
  } catch (e) {
    return defaultProgress();
  }
}

function saveProgress() {
  const uid = currentUser ? currentUser.id : "";
  try {
    localStorage.setItem(progressKey(uid), JSON.stringify(progress));
  } catch (e) { /* ignore */ }
}

/* ---------- مدیریت کاربران ---------- */
const USERS_KEY = LS_KEY + "_USERS";

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || data.length === 0) return null;
    return data;
  } catch (e) {
    return null;
  }
}

function saveUsers() {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(userRegistry));
  } catch (e) { /* ignore */ }
}

/* فهرست کاربران برنامه (ابتدا از data.js، سپس از localStorage) */
let userRegistry = loadUsers() || USERS.map((u) => ({ ...u }));

function userById(id) {
  return userRegistry.find((u) => u.id === id);
}

function isAdminUser() {
  return !!currentUser && currentUser.role === "admin";
}

/* ورود: صحت رمز + ثبت کاربر جاری + بارگذاری پیشرفت او */
function login(userId, pass) {
  const u = userById(userId);
  if (!u) return { ok: false, message: "کاربر پیدا نشد." };
  if (u.pass !== pass) return { ok: false, message: "رمز عبور اشتباه است." };
  currentUser = u;
  progress = loadProgress();
  updateStreak();
  afterUserChange();
  return { ok: true };
}

/* خروج: حذف کاربر جاری (بدون پاک کردن پیشرفت) */
function logout() {
  currentUser = null;
  progress = defaultProgress();
  afterUserChange();
}

/* تعویض کاربر از پنل مدیریت */
function switchUser(id) {
  const u = userById(id);
  if (!u) return;
  currentUser = u;
  progress = loadProgress();
  updateStreak();
  afterUserChange();
}

/* باز-رندر همه‌چیز پس از تغییر کاربر */
function afterUserChange() {
  renderHeaderProgress();
  renderUserChip();
  renderLogin();
  if ($("#view-admin")) {
    const showAdmin = isAdminUser();
    const navAdmin = $(".nav-item[data-nav='admin']");
    if (navAdmin) navAdmin.hidden = !showAdmin;
    if (currentView === "admin" && !showAdmin) showView("home");
    if (showAdmin && $("#view-admin")) renderAdminPanel();
  }
  showView(currentView);
}

/* پرکردن فهرست کاربران صفحهٔ ورود */
function renderLogin() {
  const sel = $("#loginUserSelect");
  if (!sel) return;
  sel.innerHTML = "";
  userRegistry.slice().sort((a, b) => (a.role === b.role ? 0 : a.role === "admin" ? -1 : 1)).forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.id;
    opt.textContent = (u.role === "admin" ? "👑 " : "") + u.name + " @" + u.id;
    sel.appendChild(opt);
  });
  $("#loginError").hidden = true;
  $("#loginError").textContent = "";
  $("#loginPass").value = "";
}

/* چاپ بج کاربر در هدر */
function renderUserChip() {
  const chip = $("#headerUserName");
  const btn = $("#btnLogout");
  if (!chip || !btn) return;
  if (currentUser) {
    chip.textContent = currentUser.name;
    chip.title = "@" + currentUser.id + (isAdminUser() ? " (مدیر)" : "");
    btn.hidden = false;
  } else {
    chip.textContent = "کاربر مهمان";
    chip.title = "";
    btn.hidden = true;
  }
}

/* پنل مدیریت کاربران (فقط مدیر) */
function renderAdminPanel() {
  if (!isAdminUser()) return;
  const tbody = $("#adminUsersBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const stats = (u) => {
    try {
      const raw = localStorage.getItem(progressKey(u.id));
      const d = raw ? JSON.parse(raw) : defaultProgress();
      return { learned: (d.learned || []).length, streak: d.streak || 0 };
    } catch (e) {
      return { learned: 0, streak: 0 };
    }
  };

  userRegistry.slice().forEach((u) => {
    const s = stats(u);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="user-avatar">${u.role === "admin" ? "👑" : "👤"}</span></td>
      <td>
        <div class="user-name">${u.name}</div>
        <div class="user-id">@${u.id}</div>
      </td>
      <td>${u.role === "admin" ? '<span class="badge badge-admin">مدیر</span>' : '<span class="badge badge-user">کاربر</span>'}</td>
      <td>${toFa(s.learned)} / ${toFa(TOTAL_WORDS)}</td>
      <td>${toFa(s.streak)}</td>
      <td class="admin-actions">
        <button class="btn btn-ghost btn-sm" data-switch="${u.id}" ${u.id === currentUser.id ? "disabled title=\"کاربر جاری\"" : ""}>ورود</button>
        <button class="btn btn-ghost btn-sm" data-reset="${u.id}" title="بازنشانی پیشرفت">🔄</button>
        <button class="btn btn-danger btn-sm" data-del="${u.id}" ${u.role === "admin" || u.id === currentUser.id ? "disabled title=\"غیرقابل حذف\"" : ""}>حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  $$("#adminUsersBody [data-switch]").forEach((b) => {
    b.onclick = () => switchUser(b.dataset.switch);
  });
  $$("#adminUsersBody [data-reset]").forEach((b) => {
    b.onclick = () => {
      const u = userById(b.dataset.reset);
      if (!u) return;
      if (!confirm("پیشرفت «" + u.name + "» بازنشانی شود؟")) return;
      localStorage.removeItem(progressKey(u.id));
      if (u.id === currentUser.id) {
        progress = defaultProgress();
        saveProgress();
        renderHeaderProgress();
      }
      renderAdminPanel();
    };
  });
  $$("#adminUsersBody [data-del]").forEach((b) => {
    b.onclick = () => {
      const u = userById(b.dataset.del);
      if (!u || u.role === "admin" || u.id === currentUser.id) return;
      if (!confirm("کاربر «" + u.name + "» حذف شود؟ پیشرفت او هم پاک می‌شود.")) return;
      userRegistry = userRegistry.filter((x) => x.id !== u.id);
      localStorage.removeItem(progressKey(u.id));
      saveUsers();
      renderAdminPanel();
      renderLogin();
    };
  });

  $("#adminStats").textContent =
    toFa(userRegistry.length) + " کاربر — " +
    toFa(userRegistry.filter((u) => u.role === "admin").length) + " مدیر — " +
    toFa(userRegistry.filter((u) => u.role === "user").length) + " کاربر عادی";
}

/* افزودن کاربر جدید از فرم پنل مدیریت */
function addUserFromForm() {
  const nameEl = $("#adminNewName");
  const idEl = $("#adminNewUser");
  const passEl = $("#adminNewPass");
  const msgEl = $("#adminNewMsg");
  const name = (nameEl.value || "").trim();
  const id = (idEl.value || "").trim().toLowerCase();
  const pass = passEl.value || "";

  const err = (m) => {
    msgEl.textContent = m;
    msgEl.style.color = "var(--danger)";
    msgEl.hidden = false;
  };
  const ok = (m) => {
    msgEl.textContent = m;
    msgEl.style.color = "var(--success, #16a34a)";
    msgEl.hidden = false;
    nameEl.value = ""; idEl.value = ""; passEl.value = "";
  };

  if (!name) return err("نام کاربر را وارد کنید.");
  if (!/^[a-z0-9_]{3,20}$/.test(id)) return err("نام کاربری: ۳ تا ۲۰ حرف انگلیسی، عدد یا «_».");
  if (pass.length < 4) return err("رمز عبور باید حداقل ۴ نویسه باشد.");
  if (userById(id)) return err("این نام کاربری قبلاً ثبت شده است.");

  userRegistry.push({ id, name, role: "user", pass });
  saveUsers();
  renderAdminPanel();
  renderLogin();
  ok("کاربر «" + name + "» با موفقیت افزوده شد.");
}

/* استریک روزانه: در اولین باز شدن در هر روز، اگر دیروز هم باز بوده، +۱ */
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
function wordsOfLesson(lesson) {
  return WORDS.filter((w) => w.lesson === lesson);
}
function wordById(id) {
  return WORDS.find((w) => w.id === id);
}
function isLearned(id) { return progress.learned.includes(id); }
function isWeak(id) { return progress.weak.includes(id); }

const TOTAL_WORDS = WORDS.length;

/* ---------- تلفظ با Web Speech API ---------- */
let speechSupported = "speechSynthesis" in window;
let speechVoice = null;

function initSpeech() {
  if (!speechSupported) return;
  const pick = () => {
    const voices = speechSynthesis.getVoices();
    speechVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith("en")) || voices[0] || null;
  };
  pick();
  speechSynthesis.onvoiceschanged = pick;
}

function speakWord(word) {
  if (!speechSupported) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  u.rate = 0.88;
  if (speechVoice) u.voice = speechVoice;
  speechSynthesis.speak(u);
}

/* ---------- ناوبری (SPA) ---------- */
const VIEWS = ["home", "lessons", "lesson", "flashcards", "quiz", "search", "admin"];
let currentView = "home";
let currentLesson = 1;

function showView(name) {
  // دسترسی پنل مدیریت فقط برای مدیر
  if (name === "admin" && !isAdminUser()) name = "home";
  currentView = name;
  // صفحهٔ ورود: دروازهٔ همهٔ بخش‌ها
  $("#view-login").hidden = !!currentUser;
  VIEWS.forEach((v) => {
    $("#view-" + v).hidden = v !== name || !currentUser;
  });
  $$(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === name);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
  // بستن منوی موبایل
  $("#navToggle").classList.remove("open");
  $(".main-nav").classList.remove("open");
  $("#navToggle").setAttribute("aria-expanded", "false");

  if (name === "home") renderHome();
  if (name === "lessons") renderLessons();
  if (name === "flashcards") initFlashcards();
  if (name === "quiz") { initQuizSetup(); }
  if (name === "search") { $("#searchInput").focus(); }
  if (name === "admin") renderAdminPanel();
}

/* ---------- رندر نوار پیشرفت هدر ---------- */
function renderHeaderProgress() {
  const pct = Math.round((progress.learned.length / TOTAL_WORDS) * 100);
  $("#headerPct").textContent = toFa(pct) + "٪";
  const circ = 2 * Math.PI * 15.5; // ≈ 97.4
  const offset = circ - (pct / 100) * circ;
  $("#ringFg").style.strokeDashoffset = offset;
}

/* ============================================================
   صفحه خانه
   ============================================================ */
function renderHome() {
  const learnedCount = progress.learned.length;
  const pct = Math.round((learnedCount / TOTAL_WORDS) * 100);

  // آمار
  $("#statTotal").textContent = toFa(TOTAL_WORDS);
  $("#statLearned").textContent = toFa(learnedCount);
  $("#statPct").textContent = toFa(pct) + "٪";
  $("#statStreak").textContent = toFa(progress.streak);

  // ادامه یادگیری: اولین درسی که ناقص است
  let nextLesson = 1;
  for (let L = 1; L <= LESSON_COUNT; L++) {
    const all = wordsOfLesson(L);
    const done = all.filter((w) => isLearned(w.id)).length;
    if (done < WORDS_PER_LESSON) { nextLesson = L; break; }
  }
  const doneInNext = wordsOfLesson(nextLesson).filter((w) => isLearned(w.id)).length;
  $("#nextLessonNum").textContent = "درس " + toFa(nextLesson);
  $("#nextLessonText").textContent =
    doneInNext === 0
      ? "برای شروع، این درس را باز کنید."
      : toFa(doneInNext) + " از " + toFa(WORDS_PER_LESSON) + " کلمهٔ این درس آموخته شده است.";
  $("#btnContinue").onclick = () => openLesson(nextLesson);
}

/* ============================================================
   درس‌ها
   ============================================================ */
function renderLessons() {
  const grid = $("#lessonsGrid");
  grid.innerHTML = "";
  for (let L = 1; L <= LESSON_COUNT; L++) {
    const all = wordsOfLesson(L);
    const done = all.filter((w) => isLearned(w.id)).length;
    const card = document.createElement("button");
    card.className = "lesson-card" + (done === WORDS_PER_LESSON ? " done" : "");
    card.innerHTML = `
      <span class="lesson-num">درس ${toFa(L)}</span>
      <div class="lesson-name">کلمات درس ${toFa(L)}</div>
      <div class="lesson-meta">
        <span>${toFa(done)} / ${toFa(WORDS_PER_LESSON)}</span>
        <span>${done === WORDS_PER_LESSON ? "✓ کامل شد" : "یادگرفته"}</span>
      </div>
    `;
    card.onclick = () => openLesson(L);
    grid.appendChild(card);
  }
}

function openLesson(lesson) {
  currentLesson = lesson;
  $("#lessonTitle").textContent = "درس " + toFa(lesson);
  $("#lessonSubtitle").textContent =
    toFa(WORDS_PER_LESSON) + " کلمه — برای مرور آن‌ها فلش‌کارت را باز کنید.";

  const list = $("#wordList");
  list.innerHTML = "";
  wordsOfLesson(lesson).forEach((w, i) => {
    const learned = isLearned(w.id);
    const card = document.createElement("div");
    card.className = "word-card" + (learned ? " learned" : "");
    card.style.animationDelay = (i * 30) + "ms";
    card.innerHTML = `
      <div class="wc-main">
        <div class="wc-en">
          <span>${w.word}</span>
          <button class="speak-mini" data-speak="${w.word}" title="تلفظ">🔊</button>
        </div>
        <div class="wc-fa">${w.meaning}</div>
      </div>
      <button class="check-toggle${learned ? " checked" : ""}" data-learn="${w.id}" title="علامت به‌عنوان آموخته‌شده">✓</button>
    `;
    list.appendChild(card);
  });

  $$("#wordList .speak-mini").forEach((b) => {
    b.onclick = (e) => { e.stopPropagation(); speakWord(b.dataset.speak); };
  });
  $$("#wordList .check-toggle").forEach((b) => {
    b.onclick = () => toggleLearned(Number(b.dataset.learn), b);
  });

  $("#btnLessonFlashcards").onclick = () => {
    populateLessonSelects(); // ساخت گزینه‌ها قبل از ست‌کردن مقدار (مهم برای مرورگر)
    $("#fcLessonSelect").value = String(lesson);
    showView("flashcards");
  };
  $("#btnLessonQuiz").onclick = () => {
    populateLessonSelects(); // ساخت گزینه‌ها قبل از ست‌کردن مقدار
    $("#quizScope").value = String(lesson);
    showView("quiz");
  };

  showView("lesson");
}

function toggleLearned(id, btnEl) {
  if (isLearned(id)) {
    progress.learned = progress.learned.filter((x) => x !== id);
  } else {
    progress.learned.push(id);
    // اگر یاد گرفته شد، از لیست ضعیف خارج می‌شود
    progress.weak = progress.weak.filter((x) => x !== id);
  }
  saveProgress();
  renderHeaderProgress();

  if (btnEl) {
    btnEl.classList.toggle("checked", isLearned(id));
    const card = btnEl.closest(".word-card");
    if (card) card.classList.toggle("learned", isLearned(id));
  }
}

/* ---------- پرکردن انتخاب‌گرهای درس (فلش‌کارت و آزمون) ---------- */
let selectsPopulated = false;
function populateLessonSelects() {
  if (selectsPopulated) return;
  selectsPopulated = true;

  for (let L = 1; L <= LESSON_COUNT; L++) {
    const opt1 = document.createElement("option");
    opt1.value = String(L);
    opt1.textContent = "درس " + toFa(L);
    $("#fcLessonSelect").appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = String(L);
    opt2.textContent = "درس " + toFa(L) + " (" + toFa(WORDS_PER_LESSON) + " کلمه)";
    $("#quizScope").appendChild(opt2);
  }

  $("#fcLessonSelect").onchange = rebuildFlashcards;
  $("#fcModeSelect").onchange = rebuildFlashcards;
  $("#fcShuffle").onchange = rebuildFlashcards;
}

/* ============================================================
   فلش‌کارت
   ============================================================ */
let fcList = [];        // لیست کلمات جاری
let fcIndex = 0;

function initFlashcards() {
  populateLessonSelects();
  rebuildFlashcards();
}

function rebuildFlashcards() {
  const lesson = Number($("#fcLessonSelect").value);
  const mode = $("#fcModeSelect").value;
  const shuffleOn = $("#fcShuffle").checked;

  let list = lesson === 0 ? [...WORDS] : wordsOfLesson(lesson);

  if (mode === "learned") list = list.filter((w) => isLearned(w.id));
  else if (mode === "unlearned") list = list.filter((w) => !isLearned(w.id));
  else if (mode === "weak") list = list.filter((w) => isWeak(w.id));

  fcList = shuffleOn ? shuffle(list) : list;
  fcIndex = 0;
  renderFlashcard();
}

function renderFlashcard() {
  const empty = fcList.length === 0;
  $("#fcArea").style.display = empty ? "none" : "";
  $("#fcEmpty").hidden = !empty;
  if (empty) return;

  const w = fcList[fcIndex];
  $("#fcPos").textContent = toFa(fcIndex + 1) + " / " + toFa(fcList.length);
  $("#fcBar").style.width = ((fcIndex + 1) / fcList.length) * 100 + "%";
  $("#fcLessonTag").textContent = "درس " + toFa(w.lesson);
  $("#fcWord").textContent = w.word;
  $("#fcMeaning").textContent = w.meaning;
  $("#flashcard").classList.remove("flipped");

  // وضعیت دکمه‌ها
  const learned = isLearned(w.id);
  $("#fcLearned").textContent = learned ? "✓ آموخته شده" : "✓ یاد گرفتم";
  $("#fcLearned").classList.toggle("btn-success", !learned);
  $("#fcLearned").classList.toggle("btn-secondary", learned);
}

/* ناوبری فلش‌کارت */
function fcPrev() {
  if (!fcList.length) return;
  fcIndex = (fcIndex - 1 + fcList.length) % fcList.length;
  renderFlashcard();
}
function fcNext() {
  if (!fcList.length) return;
  fcIndex = (fcIndex + 1) % fcList.length;
  renderFlashcard();
}

function wireFlashcards() {
  const card = $("#flashcard");
  card.onclick = () => card.classList.toggle("flipped");
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.classList.toggle("flipped"); }
  });
  $("#fcSpeak").onclick = (e) => { e.stopPropagation(); speakWord(fcList[fcIndex].word); };
  $("#fcFlipHint").onclick = () => card.classList.add("flipped");
  $("#fcPrev").onclick = fcPrev;
  $("#fcNext").onclick = fcNext;

  $("#fcLearned").onclick = () => {
    if (!fcList.length) return;
    const w = fcList[fcIndex];
    toggleLearned(w.id, null);
    renderFlashcard();
  };

  $("#fcWeak").onclick = () => {
    if (!fcList.length) return;
    const w = fcList[fcIndex];
    if (!progress.weak.includes(w.id)) {
      progress.weak.push(w.id);
      saveProgress();
    }
    renderFlashcard();
  };
}

/* ============================================================
   آزمون
   ============================================================ */
let quizSession = null; // { questions: [{word, meaning, options:[{text, correct}]}], index, correct }

function initQuizSetup() {
  populateLessonSelects();

  // حذف جعبهٔ مرور قبلی
  $("#quizReviewBox")?.remove();

  // نمایش دوبارهٔ صفحهٔ تنظیمات
  $("#quizSetup").hidden = false;
  $("#quizRun").hidden = true;
  $("#quizResult").hidden = true;
  $("#btnQuizNext").hidden = true;
  $("#quizFeedback").hidden = true;
}

function startQuiz() {
  const scope = Number($("#quizScope").value);
  let count = Number($("#quizCount").value);
  const dir = $("#quizDir").value;

  let pool = scope === 0 ? [...WORDS] : wordsOfLesson(scope);
  count = Math.min(count, pool.length);

  // ساخت سؤال‌ها
  const questions = shuffle(pool).slice(0, count).map((w) => {
    // انتخاب جهت
    const qDir = dir === "mixed" ? (Math.random() < 0.5 ? "en2fa" : "fa2en") : dir;
    // گزینه‌های اشتباه: چند کلمهٔ تصادفی دیگر
    const distractors = shuffle(pool.filter((p) => p.id !== w.id)).slice(0, 3);
    const opts = [];
    const addOpt = (text, correct) => opts.push({ text, correct });
    if (qDir === "en2fa") {
      addOpt(w.meaning, true);
      distractors.forEach((d) => addOpt(d.meaning, false));
    } else {
      addOpt(w.word, true);
      distractors.forEach((d) => addOpt(d.word, false));
    }
    // مخلوط کردن گزینه‌ها
    const mixed = shuffle(opts).map((o, i) => Object.assign(o, { key: "abcd"[i] }));
    return { word: w, meaning: w.meaning, dir: qDir, options: mixed };
  });

  quizSession = { questions, index: 0, correct: 0 };
  $("#quizSetup").hidden = true;

  renderQuizQuestion();
}

function renderQuizQuestion() {
  const q = quizSession.questions[quizSession.index];
  const total = quizSession.questions.length;
  $("#quizRun").hidden = false;
  $("#quizResult").hidden = true;

  $("#quizCountLabel").textContent = "سؤال " + toFa(quizSession.index + 1) + " از " + toFa(total);
  $("#quizBar").style.width = ((quizSession.index) / total) * 100 + "%";
  $("#quizScoreLabel").textContent = toFa(quizSession.correct) + " امتیاز";

  // متن سؤال
  const target = q.dir === "en2fa" ? q.word.word : q.meaning;
  $("#quizQuestion").innerHTML =
    q.dir === "en2fa"
      ? `معنی کلمهٔ <span class="q-word" lang="en">«${q.word.word}»</span> چیست؟`
      : `کدام کلمه معنی «${q.meaning}» را دارد؟`;

  // گزینه‌ها
  const box = $("#quizOptions");
  box.innerHTML = "";
  q.options.forEach((o) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.dataset.key = o.key;
    btn.dataset.correct = o.correct ? "1" : "0";
    btn.innerHTML = `<span class="opt-key">${o.key}</span><span class="opt-text">${o.text}</span>`;
    btn.addEventListener("click", () => answerQuiz(btn, o));
    box.appendChild(btn);
  });

  // بعد از انتخاب، دکمهٔ بعدی
  $("#quizFeedback").hidden = true;
  $("#quizFeedback").className = "quiz-feedback";
  $("#btnQuizNext").hidden = true;
  $("#btnQuizNext").textContent = quizSession.index + 1 >= total ? "مشاهدهٔ نتیجه 🏁" : "سؤال بعدی ←";
}

function answerQuiz(btnEl, chosen) {
  const q = quizSession.questions[quizSession.index];
  const buttons = $$("#quizOptions .quiz-option");

  buttons.forEach((b) => (b.disabled = true));
  const correctBtn = buttons.find((b) => b.dataset.correct === "1");

  if (chosen.correct) {
    quizSession.correct++;
    btnEl.classList.add("correct");
  } else {
    btnEl.classList.add("wrong");
    if (correctBtn) correctBtn.classList.add("correct");
  }

  const fb = $("#quizFeedback");
  fb.hidden = false;
  if (chosen.correct) {
    fb.className = "quiz-feedback ok";
    fb.textContent = "✓ آفرین! پاسخ درست بود.";
  } else {
    const rightText = q.options.find((o) => o.correct).text;
    fb.className = "quiz-feedback no";
    fb.textContent = "✗ پاسخ درست: «" + rightText + "»";
  }

  $("#btnQuizNext").hidden = false;
  $("#quizScoreLabel").textContent = toFa(quizSession.correct) + " امتیاز";
  $("#quizBar").style.width = ((quizSession.index + 1) / quizSession.questions.length) * 100 + "%";
}

function nextQuizQuestion() {
  if (quizSession.index + 1 >= quizSession.questions.length) {
    finishQuiz();
    return;
  }
  quizSession.index++;
  renderQuizQuestion();
}

function finishQuiz() {
  const total = quizSession.questions.length;
  const correct = quizSession.correct;
  $("#quizRun").hidden = true;

  // ثبت نتیجه در تاریخچه
  progress.quizResults.push({
    date: new Date().toISOString().slice(0, 10),
    scopeLesson: Number($("#quizScope").value),
    total,
    correct
  });
  if (progress.quizResults.length > 100) progress.quizResults = progress.quizResults.slice(-100);
  saveProgress();

  renderQuizResult(correct, total);
}

function renderQuizResult(correct, total) {
  const pct = Math.round((correct / total) * 100);
  $("#quizResult").hidden = false;

  let emoji, title;
  if (pct >= 90) { emoji = "🏆"; title = "فوق‌العاده! استادانه!"; }
  else if (pct >= 70) { emoji = "🎉"; title = "آفرین! عالی بود!"; }
  else if (pct >= 50) { emoji = "👍"; title = "خوب بود، ادامه بده!"; }
  else { emoji = "💪"; title = "نیاز به تمرین بیشتر داری!"; }

  $("#resultEmoji").textContent = emoji;
  $("#resultTitle").textContent = title;
  $("#resultScore").textContent = toFa(correct) + " از " + toFa(total);
  $("#resultPercent").textContent = toFa(pct) + "٪ پاسخ درست";

  $("#btnQuizAgain").onclick = () => {
    $("#quizSetup").hidden = false;
    $("#quizRun").hidden = true;
    $("#quizResult").hidden = true;
    $("#quizReviewBox")?.remove();
  };
  $("#btnQuizReview").onclick = showQuizReview;
}

function showQuizReview() {
  // مرور پاسخ‌ها: لیست سادهٔ سؤال و پاسخ درست
  let html = "";
  quizSession.questions.forEach((q, i) => {
    const right = q.options.find((o) => o.correct).text;
    const tag = q.dir === "en2fa" ? "معنی" : "کلمه";
    html += `<div class="word-card" style="animation:none"><div class="wc-main"><div class="wc-en">${toFa(i + 1)}. ${q.word.word}</div><div class="wc-fa">${tag}: ${right}</div></div></div>`;
  });
  $("#quizResult").hidden = true;
  $("#quizRun").hidden = true;
  showView("quiz");
  // نمایش حالت مرور به‌جای تنظیمات
  $("#quizSetup").hidden = true;
  const oldBox = $("#quizReviewBox");
  if (oldBox) oldBox.remove();
  const reviewBox = document.createElement("div");
  reviewBox.id = "quizReviewBox";
  reviewBox.className = "panel";
  reviewBox.style.marginBottom = "18px";
  reviewBox.innerHTML = `<h2 class="panel-title">مرور پاسخ‌ها</h2>${html}`;
  const back = document.createElement("button");
  back.className = "btn btn-primary";
  back.textContent = "بازگشت";
  back.style.marginTop = "14px";
  back.onclick = () => {
    reviewBox.remove();
    $("#quizSetup").hidden = false;
  };
  reviewBox.appendChild(back);
  $("#quizSetup").after(reviewBox);
}

/* ============================================================
   جستجو
   ============================================================ */
function initSearch() {
  $("#searchInput").addEventListener("input", () => {
    renderSearch();
  });
}

const NORM_MAP = { "آ": "ا", "ي": "ی", "ك": "ک", "ة": "ه" };
function normalize(str) {
  return String(str).toLowerCase().replace(/[آأإ]/g, "ا").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/ة/g, "ه");
}

function renderSearch() {
  const q = normalize($("#searchInput").value);
  const results = $("#searchResults");
  $("#btnSearchClear").hidden = q === "";

  if (q === "") {
    results.innerHTML = "";
    $("#searchStats").textContent = "";
    $("#searchEmpty").hidden = true;
    return;
  }

  const found = WORDS.filter((w) =>
    normalize(w.word).includes(q) || normalize(w.meaning).includes(q)
  );

  $("#searchStats").textContent = toFa(found.length) + " نتیجه برای «" + $("#searchInput").value.trim() + "»";
  $("#searchEmpty").hidden = found.length > 0;

  results.innerHTML = "";
  found.forEach((w) => {
    const learned = isLearned(w.id);
    const card = document.createElement("div");
    card.className = "word-card" + (learned ? " learned" : "");
    card.innerHTML = `
      <div class="wc-main">
        <div class="wc-en">
          <span>${w.word}</span>
          <button class="speak-mini" data-speak="${w.word}" title="تلفظ">🔊</button>
        </div>
        <div class="wc-fa">${w.meaning}</div>
        <div class="lesson-meta" style="font-size:11px;color:var(--ink-faint);margin-top:4px">درس ${toFa(w.lesson)}</div>
      </div>
      <button class="check-toggle${learned ? " checked" : ""}" data-learn="${w.id}" title="علامت به‌عنوان آموخته‌شده">✓</button>
    `;
    results.appendChild(card);
  });

  $$("#searchResults .speak-mini").forEach((b) => {
    b.onclick = (e) => { e.stopPropagation(); speakWord(b.dataset.speak); };
  });
  $$("#searchResults .check-toggle").forEach((b) => {
    b.onclick = () => toggleLearned(Number(b.dataset.learn), b);
  });
}

/* ============================================================
   حذف پیشرفت (مودال، در دسترس از کنسول / دکمهٔ فوتر)
   ============================================================ */
function resetProgress() {
  progress = defaultProgress();
  saveProgress();
  renderHeaderProgress();
  if (currentView === "home") renderHome();
  if (currentView === "lessons") renderLessons();
  if (currentView === "flashcards") initFlashcards();
}

/* ============================================================
   اتصال رویدادها و راه‌اندازی
   ============================================================ */
function wireGlobal() {
  // ناوبری
  $$("[data-nav]").forEach((el) => {
    el.addEventListener("click", () => showView(el.dataset.nav));
  });

  // منوی موبایل
  const toggle = $("#navToggle");
  toggle.addEventListener("click", () => {
    const open = toggle.classList.toggle("open");
    $(".main-nav").classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  // دکمه‌های فلش‌کارت
  wireFlashcards();

  // آزمون
  $("#btnStartQuiz").addEventListener("click", startQuiz);
  $("#btnQuizNext").addEventListener("click", nextQuizQuestion);

  // جستجو
  initSearch();
  $("#btnSearchClear").addEventListener("click", () => {
    $("#searchInput").value = "";
    renderSearch();
    $("#searchInput").focus();
  });

  // بازگشت به درس‌ها
  $("#btnBackLessons").addEventListener("click", () => showView("lessons"));

  /* ---------- ورود / خروج / مدیریت کاربران ---------- */
  $("#btnLogin").addEventListener("click", () => {
    const sel = $("#loginUserSelect");
    const pass = $("#loginPass").value;
    const res = login(sel.value, pass);
    if (!res.ok) {
      $("#loginError").textContent = res.message;
      $("#loginError").hidden = false;
      $("#loginPass").value = "";
    }
  });
  $("#loginPass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") $("#btnLogin").click();
  });
  $("#btnLogout").addEventListener("click", () => {
    logout();
    showView("home");
  });

  // پنل مدیریت
  $("#btnAdminAddUser").addEventListener("click", () => {
    addUserFromForm();
  });
  $("#btnAdminRefresh").addEventListener("click", () => {
    renderAdminPanel();
  });
  $("#adminNewPass").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addUserFromForm();
  });

  // مودال پاک‌کردن
  $("#btnModalCancel").addEventListener("click", () => {
    $("#modalBackdrop").hidden = true;
  });
  $("#btnModalConfirm").addEventListener("click", () => {
    resetProgress();
    $("#modalBackdrop").hidden = true;
  });
  $("#btnResetFooter").addEventListener("click", () => {
    $("#modalBackdrop").hidden = false;
  });

  // میان‌برهای صفحه‌کلید
  document.addEventListener("keydown", (e) => {
    // در آزمون: ۱-۴ برای گزینه‌ها
    if (currentView === "quiz" && !$("#quizRun").hidden && $("#btnQuizNext").hidden) {
      const keys = ["1", "2", "3", "4"];
      if (keys.includes(e.key)) {
        const btns = $$("#quizOptions .quiz-option").filter((b) => !b.disabled);
        const idx = keys.indexOf(e.key);
        if (btns[idx]) btns[idx].click();
      }
      if (e.key === "Enter" && !$("#btnQuizNext").hidden) $("#btnQuizNext").click();
    }
    // فلش‌کارت: ناوبری با جهت
    if (currentView === "flashcards" && fcList.length && $("#fcArea").style.display !== "none") {
      if (e.key === "ArrowLeft") fcNext();
      if (e.key === "ArrowRight") fcPrev();
    }
  });
}

/* اگر کاربر بخواهد پیشرفت را پاک کند (از طریق دکمهٔ پیشرفته) */
window.resetAllProgress = () => {
  $("#modalBackdrop").hidden = false;
};

function init() {
  initSpeech();
  /* ورود خودکار با نخستین کاربر عادی (علی) تا تجربهٔ بدون اصطکاک حفظ شود */
  const firstUser = userRegistry.find((u) => u.role === "user") || userRegistry[0];
  if (firstUser) {
    currentUser = firstUser;
    progress = loadProgress();
    updateStreak();
  }
  renderLogin();
  renderUserChip();
  renderHeaderProgress();
  wireGlobal();
  renderHome();
  showView("home");
}

/* replay شدن مرور پاسخ‌ها بعد از رفرش */
document.addEventListener("DOMContentLoaded", init);