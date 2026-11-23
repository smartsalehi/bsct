/* =========================================================
   ارزیابی BSC برنامه حمل‌ونقل عمومی شهر
   اتوبوس / تاکسی / قطار شهری
   ========================================================= */
"use strict";

/* ---------------------------------------------------------
   ۱) مدل داده
   --------------------------------------------------------- */

const MODES = {
  bus: { label: "اتوبوس", emoji: "🚌", varName: "--bus" },
  taxi: { label: "تاکسی", emoji: "🚕", varName: "--taxi" },
  metro: { label: "قطار شهری", emoji: "🚇", varName: "--metro" },
};

const PERSPECTIVES = {
  financial: {
    label: "مالی",
    short: "مالی",
    emoji: "💠",
    varName: "--persp-financial",
    base: "#0e7490",
    desc: "پایداری مالی و بهره‌وری منابع",
  },
  customer: {
    label: "مشتری (مسافر)",
    short: "مشتری",
    emoji: "🧑‍🤝‍🧑",
    varName: "--persp-customer",
    base: "#f59e0b",
    desc: "رضایت، جذب مسافر و سهم از سفر",
  },
  internal: {
    label: "فرآیندهای داخلی",
    short: "فرآیندها",
    emoji: "⚙️",
    varName: "--persp-internal",
    base: "#7c3aed",
    desc: "نظم سرویس، سرعت و دسترسی",
  },
  learning: {
    label: "یادگیری و رشد",
    short: "یادگیری",
    emoji: "🎓",
    varName: "--persp-learning",
    base: "#16a34a",
    desc: "توانمندسازی نیروی انسانی و ناوگان",
  },
};

const PERSPECTIVE_ORDER = ["financial", "customer", "internal", "learning"];

/**
 * direction: "up"   → هرچه بیشتر بهتر  (Score = Value/Target)
 *            "down" → هرچه کمتر بهتر   (Score = Target/Value)
 */
const INDICATORS = [
  // ---------- مالی ----------
  {
    id: "costRecovery",
    perspective: "financial",
    name: "نسبت پوشش هزینه‌های عملیاتی",
    unit: "٪",
    target: 60,
    direction: "up",
    values: { bus: 38, taxi: 85, metro: 42 },
  },
  {
    id: "subsidyPerTrip",
    perspective: "financial",
    name: "یارانه پرداختی به ازای هر سفر",
    unit: "هزار تومان",
    target: 20,
    direction: "down",
    values: { bus: 34, taxi: 9, metro: 38 },
  },
  {
    id: "costPerPaxKm",
    perspective: "financial",
    name: "هزینه عملیاتی هر مسافر-کیلومتر",
    unit: "تومان",
    target: 1200,
    direction: "down",
    values: { bus: 1900, taxi: 2600, metro: 1050 },
  },

  // ---------- مشتری ----------
  {
    id: "satisfaction",
    perspective: "customer",
    name: "رضایت مسافران (از ۱۰)",
    unit: "از ۱۰",
    target: 8.5,
    direction: "up",
    values: { bus: 6.1, taxi: 7.0, metro: 7.6 },
  },
  {
    id: "modeShare",
    perspective: "customer",
    name: "سهم از سفرهای موتوری شهر",
    unit: "٪",
    target: 45,
    direction: "up",
    values: { bus: 21, taxi: 11, metro: 13 },
  },
  {
    id: "complaints",
    perspective: "customer",
    name: "شکایات به ازای ۱۰۰ هزار سفر",
    unit: "مورد",
    target: 25,
    direction: "down",
    values: { bus: 46, taxi: 58, metro: 18 },
  },

  // ---------- فرآیندهای داخلی ----------
  {
    id: "onTime",
    perspective: "internal",
    name: "دقت زمان‌بندی سرویس‌ها",
    unit: "٪",
    target: 95,
    direction: "up",
    values: { bus: 74, taxi: 68, metro: 92 },
  },
  {
    id: "speed",
    perspective: "internal",
    name: "سرعت تجاری شبکه",
    unit: "km/h",
    target: 30,
    direction: "up",
    values: { bus: 18, taxi: 22, metro: 36 },
  },
  {
    id: "accessibility",
    perspective: "internal",
    name: "دسترس‌پذیری ایستگاه برای کم‌توانان",
    unit: "٪",
    target: 90,
    direction: "up",
    values: { bus: 63, taxi: 40, metro: 78 },
  },

  // ---------- یادگیری و رشد ----------
  {
    id: "training",
    perspective: "learning",
    name: "ساعت آموزش سالانه هر راننده",
    unit: "ساعت",
    target: 40,
    direction: "up",
    values: { bus: 22, taxi: 12, metro: 34 },
  },
  {
    id: "fleetAge",
    perspective: "learning",
    name: "میانگین عمر ناوگان",
    unit: "سال",
    target: 5,
    direction: "down",
    values: { bus: 9.2, taxi: 7.5, metro: 6.4 },
  },
  {
    id: "cleanFleet",
    perspective: "learning",
    name: "سهم ناوگان با سوخت پاک",
    unit: "٪",
    target: 50,
    direction: "up",
    values: { bus: 27, taxi: 18, metro: 61 },
  },
];

const DEFAULT_WEIGHTS = { financial: 25, customer: 30, internal: 25, learning: 20 };

const state = {
  mode: "bus",
  weights: { ...DEFAULT_WEIGHTS },
};

/* ---------------------------------------------------------
   ۲) توابع محاسباتی
   --------------------------------------------------------- */

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** امتیاز یک شاخص برای یک شیوه: 0..100 */
function indicatorScore(ind, mode) {
  const value = ind.values[mode];
  if (!value || value <= 0) return 0;
  const raw =
    ind.direction === "up"
      ? (value / ind.target) * 100
      : (ind.target / value) * 100;
  return Math.round(clamp(raw, 0, 100) * 10) / 10;
}

function indicatorsOf(perspective) {
  return INDICATORS.filter((i) => i.perspective === perspective);
}

/** امتیاز یک منظر برای یک شیوه (میانگین ساده شاخص‌ها) */
function perspectiveScore(perspective, mode) {
  const items = indicatorsOf(perspective);
  if (!items.length) return 0;
  const sum = items.reduce((s, ind) => s + indicatorScore(ind, mode), 0);
  return Math.round((sum / items.length) * 10) / 10;
}

/** مجموع وزن‌ها */
function weightTotal() {
  return PERSPECTIVE_ORDER.reduce((s, p) => s + (state.weights[p] || 0), 0);
}

/** وزن نرمال‌شده (۰ تا ۱) */
function normalizedWeights() {
  const total = weightTotal() || 1;
  const out = {};
  PERSPECTIVE_ORDER.forEach((p) => {
    out[p] = (state.weights[p] || 0) / total;
  });
  return out;
}

/** امتیاز کل وزنی برای یک شیوه */
function overallScore(mode) {
  const w = normalizedWeights();
  const total = PERSPECTIVE_ORDER.reduce(
    (s, p) => s + w[p] * perspectiveScore(p, mode),
    0
  );
  return Math.round(total * 10) / 10;
}

function gradeOf(score) {
  if (score >= 85) return { key: "good", text: "ممتاز", note: "عملکرد ممتاز — قابل تعمیم به سایر شیوه‌ها" };
  if (score >= 70) return { key: "good", text: "خوب", note: "عملکرد خوب — نیازمند بهبود هدفمند" };
  if (score >= 55) return { key: "mid", text: "متوسط", note: "عملکرد متوسط — نیازمند اولویت‌بندی اقدامات" };
  return { key: "low", text: "ضعیف", note: "عملکرد ضعیف — مداخله فوری لازم است" };
}

/* ---------------------------------------------------------
   ۳) کمکی‌ها
   --------------------------------------------------------- */

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const faNum = (n, digits = 1) =>
  Number(n).toLocaleString("fa-IR", { maximumFractionDigits: digits });

const cssVar = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

/* ---------------------------------------------------------
   ۴) منو و تم
   --------------------------------------------------------- */

const navMenu = $("#navMenu");
const menuToggle = $("#menuToggle");

menuToggle.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

navMenu.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navMenu.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  })
);

const THEME_KEY = "stm-bsc-theme";
const themeToggle = $("#themeToggle");
const themeIcon = themeToggle.querySelector(".theme-icon");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (_) {
    /* storage ممکن است در دسترس نباشد */
  }
}

let storedTheme = null;
try {
  storedTheme = localStorage.getItem(THEME_KEY);
} catch (_) {
  storedTheme = null;
}

applyTheme(
  storedTheme ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
);

themeToggle.addEventListener("click", () => {
  const now = document.documentElement.getAttribute("data-theme");
  applyTheme(now === "dark" ? "light" : "dark");
  refreshDynamicColors();
});

/* ---------------------------------------------------------
   ۵) رنگ منظرها به‌صورت متغیر CSS
   --------------------------------------------------------- */

function refreshPerspectiveColors() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  const palette = dark
    ? { financial: "#22d3ee", customer: "#fbbf24", internal: "#a78bfa", learning: "#4ade80" }
    : { financial: "#0e7490", customer: "#e08c07", internal: "#7c3aed", learning: "#16a34a" };

  PERSPECTIVE_ORDER.forEach((p) => {
    document.documentElement.style.setProperty(`--persp-${p}`, palette[p]);
  });
}

/* ---------------------------------------------------------
   ۶) رندر کارت‌های چهار منظر
   --------------------------------------------------------- */

const perspectiveGrid = $("#perspectiveGrid");

function renderPerspectives() {
  const mode = state.mode;

  perspectiveGrid.innerHTML = PERSPECTIVE_ORDER.map((p) => {
    const score = perspectiveScore(p, mode);
    const items = indicatorsOf(p);

    const rows = items
      .map(
        (ind) => `
        <li>
          <span>${ind.name}</span>
          <b>${faNum(ind.values[mode], 1)} ${ind.unit === "از ۱۰" ? "" : ind.unit}</b>
        </li>`
      )
      .join("");

    return `
      <article class="perspective-card" style="--persp-color:var(--persp-${p})">
        <div class="perspective-head">
          <span class="perspective-emoji" aria-hidden="true">${PERSPECTIVES[p].emoji}</span>
          <div>
            <h3>${PERSPECTIVES[p].label}</h3>
            <p>${PERSPECTIVES[p].desc}</p>
          </div>
        </div>

        <div class="perspective-score">
          <strong>${faNum(score, 1)}</strong><span>/ ۱۰۰</span>
        </div>
        <div class="bar"><i style="width:${score}%"></i></div>

        <ul>${rows}</ul>
      </article>`;
  }).join("");
}

/* ---------------------------------------------------------
   ۷) جدول شاخص‌ها
   --------------------------------------------------------- */

const kpiTableBody = $("#kpiTableBody");
const modeTotal = $("#modeTotal");
const tableTitle = $("#tableTitle");

function renderTable() {
  const mode = state.mode;
  const rows = [];

  PERSPECTIVE_ORDER.forEach((p) => {
    indicatorsOf(p).forEach((ind) => {
      const score = indicatorScore(ind, mode);
      rows.push(`
        <tr>
          <td><span class="persp-pill" style="--persp-color:var(--persp-${p})">
            ${PERSPECTIVES[p].emoji} ${PERSPECTIVES[p].short}
          </span></td>
          <td class="kpi-name">${ind.name}</td>
          <td>${faNum(ind.values[mode], 1)} <span class="muted small">${ind.unit}</span></td>
          <td class="muted">${faNum(ind.target, 1)} <span class="small">${ind.unit}</span></td>
          <td>
            <div class="mini-score">
              <div class="bar"><i style="width:${score}%;background:var(--persp-${p})"></i></div>
              <b>${faNum(score, 0)}</b>
            </div>
          </td>
        </tr>`);
    });
  });

  kpiTableBody.innerHTML = rows.join("");

  const total = overallScore(mode);
  const g = gradeOf(total);
  tableTitle.textContent = `شاخص‌های ${MODES[mode].emoji} ${MODES[mode].label}`;
  modeTotal.innerHTML = `امتیاز کل وزنی: <strong>${faNum(total, 1)}</strong> / ۱۰۰ — ${g.text}`;
}

/* ---------------------------------------------------------
   ۸) گیج امتیاز کل
   --------------------------------------------------------- */

const gaugeProgress = $("#gaugeProgress");
const gaugeValue = $("#gaugeValue");
const gaugeNote = $("#gaugeNote");
const gaugeLegend = $("#gaugeLegend");
const GAUGE_CIRC = 2 * Math.PI * 82; // 515.2

const GAUGE_COLORS = {
  good: "#16a34a",
  mid: "#d97706",
  low: "#dc2626",
};

function renderGauge() {
  const mode = state.mode;
  const score = overallScore(mode);
  const g = gradeOf(score);
  const dark = document.documentElement.getAttribute("data-theme") === "dark";

  gaugeProgress.style.strokeDasharray = String(GAUGE_CIRC);
  gaugeProgress.style.strokeDashoffset = String(GAUGE_CIRC * (1 - score / 100));
  gaugeProgress.style.stroke = dark
    ? { good: "#4ade80", mid: "#fbbf24", low: "#f87171" }[g.key]
    : GAUGE_COLORS[g.key];

  gaugeValue.textContent = faNum(score, 0);
  gaugeNote.textContent = `${MODES[mode].emoji} ${g.note}`;

  const w = normalizedWeights();
  gaugeLegend.innerHTML = PERSPECTIVE_ORDER.map(
    (p) => `
      <li>
        <span class="g-name">${PERSPECTIVES[p].emoji} ${PERSPECTIVES[p].short}</span>
        <span><b>${faNum(perspectiveScore(p, mode), 0)}</b>
          <span class="muted small">× ${faNum(w[p] * 100, 0)}٪</span></span>
      </li>`
  ).join("");
}

/* ---------------------------------------------------------
   ۹) کنترل وزن‌ها
   --------------------------------------------------------- */

const weightControls = $("#weightControls");
const weightSumEl = $("#weightSum");

function renderWeightControls() {
  weightControls.innerHTML = PERSPECTIVE_ORDER.map(
    (p) => `
      <div class="weight-row">
        <label for="w-${p}">
          <span aria-hidden="true">${PERSPECTIVES[p].emoji}</span> ${PERSPECTIVES[p].label}
        </label>
        <output id="out-${p}">${faNum(state.weights[p], 0)}</output>
        <input type="range" id="w-${p}" min="0" max="50" step="5"
               value="${state.weights[p]}" data-perspective="${p}"
               aria-label="وزن منظر ${PERSPECTIVES[p].label}" />
      </div>`
  ).join("");

  weightControls.querySelectorAll('input[type="range"]').forEach((range) => {
    range.addEventListener("input", () => {
      const p = range.dataset.perspective;
      state.weights[p] = Number(range.value);
      document.getElementById(`out-${p}`).textContent = faNum(state.weights[p], 0);
      updateWeightsUI();
    });
  });
}

function updateWeightsUI() {
  const total = weightTotal();
  const w = normalizedWeights();
  weightSumEl.textContent = `${faNum(total, 0)} → نرمال‌شده ۱۰۰٪`;

  PERSPECTIVE_ORDER.forEach((p) => {
    const out = document.getElementById(`out-${p}`);
    if (out) out.textContent = faNum(w[p] * 100, 0) + "٪";
  });

  renderGauge();
  drawRadar();
}

$("#resetWeights").addEventListener("click", () => {
  state.weights = { ...DEFAULT_WEIGHTS };
  renderWeightControls();
  updateWeightsUI();
});

/* ---------------------------------------------------------
   ۱۰) نمودار راداری مقایسه شیوه‌ها
   --------------------------------------------------------- */

const radarCanvas = $("#radarChart");
const radarLegend = $("#radarLegend");

function drawRadar() {
  if (!radarCanvas) return;
  const ctx = radarCanvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  const width = Math.max(280, Math.floor(radarCanvas.clientWidth || 320));
  const height = Math.min(320, Math.round(width * 0.92));
  radarCanvas.width = width * dpr;
  radarCanvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2 + 4;
  const radius = Math.min(width, height) / 2 - 52;

  const axes = PERSPECTIVE_ORDER;
  const n = axes.length;
  const angleOf = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const grid = cssVar("--border", "#e2e8f0");
  const muted = cssVar("--muted", "#64748b");

  // شبکه چندضلعی
  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  for (let ring = 1; ring <= 4; ring++) {
    const r = (radius * ring) / 4;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = angleOf(i);
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // محورها
  for (let i = 0; i < n; i++) {
    const a = angleOf(i);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.stroke();
  }

  // برچسب محورها
  ctx.font = "700 12px Vazirmatn, sans-serif";
  ctx.fillStyle = muted;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  axes.forEach((p, i) => {
    const a = angleOf(i);
    const lx = cx + Math.cos(a) * (radius + 30);
    const ly = cy + Math.sin(a) * (radius + 22);
    ctx.fillText(PERSPECTIVES[p].short, lx, ly);
  });

  // سری شیوه‌ها
  const series = [
    { mode: "bus", color: cssVar("--bus", "#2563eb") },
    { mode: "taxi", color: cssVar("--taxi", "#d97706") },
    { mode: "metro", color: cssVar("--metro", "#7c3aed") },
  ];

  series.forEach(({ mode, color }) => {
    const selected = mode === state.mode;
    const pts = axes.map((p, i) => {
      const val = perspectiveScore(p, mode) / 100;
      const a = angleOf(i);
      return { x: cx + Math.cos(a) * radius * val, y: cy + Math.sin(a) * radius * val };
    });

    ctx.beginPath();
    pts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
    ctx.closePath();

    ctx.fillStyle = hexToRgba(color, selected ? 0.22 : 0.08);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = selected ? 2.5 : 1.4;
    ctx.stroke();

    pts.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, selected ? 4 : 2.6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  });

  radarLegend.innerHTML = series
    .map(
      ({ mode, color }) => `
      <li>
        <span class="legend-color" style="background:${color}"></span>
        ${MODES[mode].emoji} ${MODES[mode].label}
        <strong>${faNum(overallScore(mode), 1)}</strong>
      </li>`
    )
    .join("");
}

function hexToRgba(hex, alpha) {
  let h = hex.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  if (Number.isNaN(num)) return `rgba(14,116,144,${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ---------------------------------------------------------
   ۱۱) تب‌های شیوه حمل‌ونقل
   --------------------------------------------------------- */

$$(".mode-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".mode-tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");

    state.mode = tab.dataset.mode;
    renderAll();
  });
});

/* ---------------------------------------------------------
   ۱۲) رندر کلی و رویدادها
   --------------------------------------------------------- */

function renderAll() {
  renderPerspectives();
  renderTable();
  renderGauge();
  drawRadar();
}

function refreshDynamicColors() {
  refreshPerspectiveColors();
  renderAll();
}

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawRadar, 120);
});

/* راه‌اندازی */
refreshPerspectiveColors();
renderPerspectives();
renderTable();
renderGauge();
renderWeightControls();
updateWeightsUI();
renderAll();

/* سال جاری در پاصفحه */
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();