/* آزمون DOM با jsdom — اجرا: node dom-test.js */
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const dir = __dirname;

let pass = 0, fail = 0;
const failures = [];
function ok(cond, name) {
  if (cond) { pass++; console.log("  ✓ " + name); }
  else { fail++; failures.push(name); console.log("  ✗ " + name); }
}

async function boot() {
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const dom = new JSDOM(html, {
    url: "http://localhost/quran/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const { window } = dom;

  // شبیه‌سازی localStorage
  const store = new Map();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    },
  });

  window.scrollTo = () => {};
  window.HTMLMediaElement.prototype.play = function () {
    this.dispatchEvent(new window.Event("play"));
    return Promise.resolve();
  };
  window.HTMLMediaElement.prototype.pause = function () {
    this.dispatchEvent(new window.Event("pause"));
  };

  // در مرورگر، اسکریپت‌های کلاسیک از یک حوزهٔ سراسری مشترک استفاده می‌کنند.
  // پس داده و منطق را در یک eval ترکیب می‌کنیم و مقادیر لازم را صریحاً صادر می‌کنیم.
  const dataJs = fs.readFileSync(path.join(dir, "data.js"), "utf8");
  const appJs = fs.readFileSync(path.join(dir, "app.js"), "utf8");
  const expose = `
    window.SURAHS = SURAHS;
    window.AYAHS = AYAHS;
    window.AYAH_COUNT = AYAH_COUNT;
    window.SURAH_COUNT = SURAH_COUNT;
    window.getQuizItems = () => quizItems;
  `;
  window.eval(dataJs + "\n" + appJs + "\n" + expose);
  window.document.dispatchEvent(new window.Event("DOMContentLoaded"));

  return { dom, window, doc: window.document, store };
}

(async () => {
  console.log("\n=== آزمون سایت جزء ۳۰ ===\n");
  const { window, doc, store } = await boot();
  const $ = (s) => doc.querySelector(s);
  const $$ = (s) => [...doc.querySelectorAll(s)];

  /* ---------- داده ---------- */
  console.log("[داده]");
  ok(window.SURAHS.length === 37, "۳۷ سوره بارگذاری شد");
  ok(window.AYAH_COUNT === 564, "۵۶۴ آیه");
  ok(window.AYAHS.length === 564, "فهرست مسطح آیات = ۵۶۴");
  ok(window.AYAHS[0].surahNumber === 78, "نخستین سوره = نبأ (۷۸)");
  ok(window.AYAHS[563].surahNumber === 114, "آخرین سوره = ناس (۱۱۴)");
  ok(window.AYAHS.every(a => a.ar && a.fa && a.g), "همهٔ آیات متن عربی/فارسی/شمارهٔ کلی دارند");
  ok(window.SURAHS.every(s => s.ayahs.length === s.total), "تعداد آیات هر سوره درست است");
  ok(window.AYAH_COUNT === window.SURAHS.reduce((n, s) => n + s.total, 0), "جمع آیات سوره‌ها = ۵۶۴");
  const gs = new Set(window.AYAHS.map(a => a.g));
  ok(gs.size === 564 && Math.min(...gs) === 5673 && Math.max(...gs) === 6236,
     "شمارهٔ کلی آیات ۵۶۷۳..۶۲۳۶ (برای صدا)");
  ok(!window.AYAHS[0].ar.startsWith("بِسْمِ"), "بسمله از آیهٔ اول حذف شده");

  /* ---------- رندر اولیه ---------- */
  console.log("\n[صفحهٔ خانه]");
  ok($("#view-home").hidden === false, "نمای خانه فعال است");
  ok($$("#homeSurahGrid .surah-card").length === 37, "۳۷ کارت سوره در خانه");
  ok($("#statTotal").textContent === "۵۶۴", "آمار کل آیات فارسی است");
  ok($("#statLearned").textContent === "۰", "آمار حفظ‌شده صفر");
  ok($("#headerPct").textContent.includes("٪"), "درصد هدر نمایش داده شد");
  ok($("#dailyAr").textContent.length > 0, "آیهٔ امروز پرشد");
  ok($("#dailyFa").textContent.length > 0, "ترجمهٔ آیهٔ امروز پرشد");

  /* ---------- ناوبری ---------- */
  console.log("\n[ناوبری]");
  $('[data-nav="surahs"]').click();
  ok($("#view-surahs").hidden === false, "نمای سوره‌ها باز شد");
  ok($("#view-home").hidden === true, "نمای خانه بسته شد");
  ok($$("#surahGrid .surah-card").length === 37, "شبکهٔ سوره‌ها پر شد");

  /* ---------- ورود به سوره ---------- */
  console.log("\n[صفحهٔ سوره]");
  $("#surahGrid .surah-card").click();
  ok($("#view-surah").hidden === false, "نمای سوره باز شد");
  ok($("#surahTitle").textContent.includes("نبأ"), "عنوان سورهٔ نبأ");
  ok($$("#ayahList .ayah-item").length === 40, "۴۰ آیه برای نبأ رندر شد");
  ok($("#bismillahText").hidden === false, "بسمله نمایش داده می‌شود");
  ok($$("#ayahList .btn-learned").length === 40, "دکمهٔ حفظ برای هر آیه");

  /* ---------- علامت‌گذاری حفظ ---------- */
  console.log("\n[پیشرفت]");
  const firstAyah = $("#ayahList .ayah-item");
  const firstId = +firstAyah.dataset.id;
  firstAyah.querySelector(".btn-learned").click();
  ok(firstAyah.classList.contains("learned"), "آیه به‌عنوان حفظ‌شده علامت خورد");
  ok($("#surahProgressText").textContent.includes("۱"), "نوار پیشرفت سوره ۱ آیه");
  const saved = JSON.parse(store.get("juz30-progress-v1"));
  ok(saved.learned.includes(firstId), "پیشرفت در localStorage ذخیره شد");
  ok($("#statLearned").textContent === "۱", "آمار کلی به‌روزرسانی شد");

  /* ---------- حالت حفظ ---------- */
  console.log("\n[حالت حفظ]");
  $("#btnHideAr").click();
  ok($("#view-surah").classList.contains("hide-ar"), "حالت پنهان‌کردن متن فعال شد");
  $("#btnHideAr").click();
  ok(!$("#view-surah").classList.contains("hide-ar"), "حالت پنهان غیرفعال شد");
  $("#btnShowFa").click();
  ok($("#view-surah").classList.contains("hide-fa"), "پنهان‌کردن ترجمه کار می‌کند");
  $("#btnShowFa").click();
  ok(!$("#view-surah").classList.contains("hide-fa"), "نمایش ترجمه بازگشت");

  /* ---------- فلش‌کارت ---------- */
  console.log("\n[فلش‌کارت]");
  $('[data-nav="flashcards"]').click();
  ok($("#view-flashcards").hidden === false, "نمای فلش‌کارت باز شد");
  ok($("#fcSurah").options.length === 38, "گزینه‌های سوره (همه + ۳۷)");
  $("#fcSurah").value = "all";
  $("#fcOrder").value = "shuffle";
  $("#fcOnly").value = "all";
  $("#btnStartFc").click();
  ok($("#fcArea").hidden === false, "ناحیهٔ مرور فعال شد");
  ok($("#fcAr").textContent.length > 0, "متن عربی کارت پر شد");
  ok($("#fcFa").textContent.length > 0, "ترجمهٔ کارت پر شد");
  ok($("#fcCounter").textContent.includes("/"), "شمارندهٔ کارت نمایش داده شد");
  $("#fcCard").click();
  ok($("#fcCard").classList.contains("flipped"), "کارت برگشت (flip)");
  const beforeNext = $("#fcAr").textContent;
  $("#fcNext").click();
  ok($("#fcAr").textContent !== beforeNext, "کارت بعدی متفاوت است");
  $("#btnLearned").click();
  ok(JSON.parse(store.get("juz30-progress-v1")).learned.length >= 1, "حفظ از فلش‌کارت ثبت شد");

  /* فیلتر «فقط آیات ضعیف» وقتی خالی است */
  $("#fcOnly").value = "weak";
  $("#btnStartFc").click();
  ok($("#fcEmpty").hidden === false, "پیام خالی برای فیلتر آیات ضعیف");

  /* ---------- آزمون ---------- */
  console.log("\n[آزمون]");
  $('[data-nav="quiz"]').click();
  ok($("#view-quiz").hidden === false, "نمای آزمون باز شد");
  ok($("#quizScope").options.length === 38, "گزینه‌های محدودهٔ آزمون");
  $("#quizType").value = "mix";
  $("#quizCount").value = "5";
  $("#btnStartQuiz").click();
  ok($("#quizArea").hidden === false, "آزمون آغاز شد");
  ok($$("#quizOptions .quiz-option").length === 4, "۴ گزینه نمایش داده شد");
  ok($("#quizQuestion").textContent.length > 0, "متن سؤال پر شد");
  ok($("#quizTypeBadge").textContent.length > 0, "برچسب نوع سؤال");

  // پاسخ درست را پیدا و کلیک کن
  const correctText = window.quizItems ? null : null;
  const opts = $$("#quizOptions .quiz-option");
  opts[0].click();
  ok(opts.every(o => o.disabled), "پس از پاسخ همهٔ گزینه‌ها قفل شدند");
  ok($("#quizFeedback").hidden === false, "بازخورد نمایش داده شد");
  ok($("#btnQuizNext").hidden === false, "دکمهٔ سؤال بعدی ظاهر شد");
  ok(opts.some(o => o.classList.contains("correct")), "گزینهٔ درست مشخص شد");

  // ادامه تا پایان
  for (let i = 0; i < 6; i++) {
    if ($("#btnQuizNext").hidden) break;
    $("#btnQuizNext").click();
    const o = $$("#quizOptions .quiz-option");
    if (o.length) o[0].click();
  }
  ok($("#quizResult").hidden === false, "صفحهٔ نتیجه نمایش داده شد");
  ok($("#resultPct").textContent.includes("٪"), "درصد نتیجه نمایش داده شد");
  ok(JSON.parse(store.get("juz30-progress-v1")).quizResults.length === 1, "نتیجهٔ آزمون ذخیره شد");

  $("#btnQuizAgain").click();
  ok($("#quizSetup").hidden === false, "آزمون دوباره قابل شروع است");

  /* ---------- جستجو ---------- */
  console.log("\n[جستجو]");
  $('[data-nav="search"]').click();
  ok($("#view-search").hidden === false, "نمای جستجو باز شد");

  const input = $("#searchInput");
  input.value = "الله";
  input.dispatchEvent(new window.Event("input"));
  await new Promise(r => setTimeout(r, 320));
  ok($$("#searchResults .search-item").length > 0, "جستجوی عربی نتیجه داد");
  ok($("#searchMeta").textContent.includes("نتیجه"), "متن تعداد نتایج");

  input.value = "سپیده";
  input.dispatchEvent(new window.Event("input"));
  await new Promise(r => setTimeout(r, 320));
  ok($$("#searchResults .search-item").length > 0, "جستجوی فارسی نتیجه داد");

  input.value = "خرما زرد"; // باید نتیجه ندهد — کنترل منفی
  input.dispatchEvent(new window.Event("input"));
  await new Promise(r => setTimeout(r, 320));
  const noRes = $$("#searchResults .search-item").length;
  ok(noRes === 0, "عبارت بی‌ربط نتیجه نمی‌دهد");

  input.value = "قُلْ";
  input.dispatchEvent(new window.Event("input"));
  await new Promise(r => setTimeout(r, 320));
  ok($$("#searchResults .search-item").length > 0, "جستجو با اعراب کار می‌کند");
  ok($$("#searchResults mark").length > 0, "هایلایت عبارت جستجو");

  // کلیک روی نتیجه → پرش به سوره
  $$("#searchResults .search-item")[0].click();
  ok($("#view-surah").hidden === false, "کلیک روی نتیجه به سوره می‌رود");

  /* ---------- پاک‌کردن پیشرفت ---------- */
  console.log("\n[پاک‌کردن پیشرفت]");
  $("#btnResetFooter").click();
  ok($("#modalBackdrop").hidden === false, "مودال تأیید باز شد");
  $("#btnModalCancel").click();
  ok($("#modalBackdrop").hidden === true, "انصراف مودال را می‌بندد");
  ok(JSON.parse(store.get("juz30-progress-v1")).learned.length >= 1, "پس از انصراف داده باقی است");

  $("#btnResetFooter").click();
  $("#btnModalConfirm").click();
  const reset = JSON.parse(store.get("juz30-progress-v1"));
  ok(reset.learned.length === 0, "پیشرفت پاک شد");
  ok($("#modalBackdrop").hidden === true, "مودال پس از تأیید بسته شد");
  ok($("#statLearned").textContent === "۰", "آمار پس از پاک‌کردن صفر شد");

  /* ---------- آیهٔ تنها / پخش پیوسته ---------- */
  console.log("\n[صدا]");
  $$('[data-nav="surahs"]')[0].click();
  $("#surahGrid .surah-card").click();
  $("#ayahList .btn-play").click();
  ok($("#audioBar").hidden === false, "نوار پخش ظاهر شد");
  ok($("#audioEl").src.includes("cdn.islamic.network"), "آدرس صدا از CDN ساخته شد");
  ok(/\d+\.mp3$/.test($("#audioEl").src), "آدرس با شمارهٔ آیه و mp3");
  ok($("#ayahList .ayah-item.playing") !== null, "آیهٔ در حال پخش مشخص شد");

  $("#btnPlaySurah").click();
  ok($("#audioTitle").textContent.includes("پخش پیوسته"), "پخش پیوستهٔ سوره آغاز شد");

  $("#audioClose").click();
  ok($("#audioBar").hidden === true, "بستن نوار پخش");
  ok($$("#ayahList .ayah-item.playing").length === 0, "کلاس پخش پاک شد");

  /* ---------- علامت‌گذاری همه ---------- */
  console.log("\n[عملیات گروهی]");
  $("#btnMarkAll").click();
  ok($$("#ayahList .ayah-item.learned").length === 40, "همهٔ ۴۰ آیه حفظ‌شده شدند");
  $("#btnMarkAll").click();
  ok($$("#ayahList .ayah-item.learned").length === 0, "علامت‌گذاری همه لغو شد");

  /* ---------- فیلتر سوره‌ها ---------- */
  console.log("\n[فیلتر سوره‌ها]");
  $$('[data-nav="surahs"]')[0].click();
  const chipTodo = $$("#surahFilterChips .chip").find(c => c.dataset.filter === "todo");
  const chipDone = $$("#surahFilterChips .chip").find(c => c.dataset.filter === "done");
  chipDone.click();
  ok($$("#surahGrid .surah-card").length === 0, "فیلتر «حفظ‌شده» با پیشرفت صفر خالی است");
  chipTodo.click();
  ok($$("#surahGrid .surah-card").length === 37, "فیلتر «حفظ‌نشده» همه را نشان می‌دهد");
  $$("#surahFilterChips .chip").find(c => c.dataset.filter === "all").click();

  const f = $("#surahFilter");
  f.value = "ناس";
  f.dispatchEvent(new window.Event("input"));
  ok($$("#surahGrid .surah-card").length === 1, "جستجوی نام سوره یک نتیجه");
  f.value = "نبود";
  f.dispatchEvent(new window.Event("input"));
  ok($$("#surahGrid .surah-card").length === 0, "سورهٔ ناموجود نتیجه ندارد");

  /* ---------- مقاومت در برابر دادهٔ خراب ---------- */
  console.log("\n[مقاومت localStorage]");
  store.set("juz30-progress-v1", "{ breaking json");
  const b2 = await boot();
  ok(b2.doc.querySelector("#statLearned") !== null, "با JSON خراب برنامه بالا می‌آید");
  ok(b2.doc.querySelector("#statLearned").textContent === "۰", "پیشرفت به پیش‌فرض بازگشت");

  /* ---------- خلاصه ---------- */
  console.log("\n" + "=".repeat(42));
  console.log(`نتیجه: ${pass} موفق، ${fail} ناموفق`);
  if (fail) {
    console.log("\nآزمون‌های ناموفق:");
    failures.forEach(f => console.log("  - " + f));
  }
  console.log("=".repeat(42) + "\n");
  process.exit(fail ? 1 : 0);
})().catch(e => {
  console.error("\nخطای اجرا:", e);
  process.exit(1);
});
