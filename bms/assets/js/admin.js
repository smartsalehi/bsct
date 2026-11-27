/* ==========================================================================
   admin.js — منطق پنل مدیریت خانه هوشمند مشهد
   ========================================================================== */
(function () {
  "use strict";

  const { $, $$, api, icon, escapeHtml, toast, faDigits, asset, TOKEN_KEY } = App;

  /* ------------------------------------------------------- upload limit */
  // باید با MAX_UPLOAD در server.js هم‌خوان باشد (پیش‌فرض ۳۰۰۰ کیلوبایت)
  const MAX_UPLOAD_KB = 3000;
  const MAX_UPLOAD = MAX_UPLOAD_KB * 1024;
  const MAX_UPLOAD_LABEL = `${faDigits(MAX_UPLOAD_KB)} کیلوبایت`;

  function faSize(bytes) {
    if (bytes < 1024) return `${faDigits(Math.round(bytes))} بایت`;
    if (bytes < 1024 * 1024) return `${faDigits(Math.round(bytes / 1024))} کیلوبایت`;
    return `${faDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
  }

  /* ------------------------------------------------------- schemas */
  const L = "full";

  const SCHEMAS = {
    products: {
      title: "محصولات",
      singular: "محصول",
      orderBy: "order",
      columns: [
        { key: "image", label: "تصویر", type: "thumb" },
        { key: "title", label: "عنوان" },
        { key: "category", label: "دسته" },
        { key: "badge", label: "برچسب" },
        { key: "order", label: "ترتیب", type: "num" },
      ],
      fields: [
        { key: "title", label: "عنوان محصول", type: "text", required: true },
        { key: "category", label: "دسته‌بندی", type: "text", hint: "مثال: زیرساخت، تجهیزات، امنیت و رفاه" },
        { key: "badge", label: "برچسب ویژه (اختیاری)", type: "text", hint: "مثال: پرفروش" },
        { key: "order", label: "ترتیب نمایش", type: "number" },
        { key: "summary", label: "خلاصه (کارت محصول)", type: "textarea", cls: L, rows: 2 },
        { key: "description", label: "توضیحات کامل", type: "textarea", cls: L, rows: 5 },
        { key: "features", label: "ویژگی‌ها (هر خط یک مورد)", type: "list", cls: L },
        { key: "specs", label: "مشخصات فنی (کلید / مقدار)", type: "specs", cls: L },
        { key: "image", label: "تصویر محصول", type: "image", cls: L },
        { key: "slug", label: "نامک آدرس (اختیاری)", type: "text", hint: "خالی بگذارید تا خودکار ساخته شود" },
      ],
      empty: { title: "", category: "تجهیزات", summary: "", description: "", features: [], specs: [], image: "assets/img/products/panel-modules.svg", order: 99 },
    },

    agents: {
      title: "عوامل اجرایی",
      singular: "عضو تیم",
      orderBy: "order",
      columns: [
        { key: "photo", label: "تصویر", type: "thumb" },
        { key: "name", label: "نام و نام خانوادگی" },
        { key: "role", label: "سمت" },
        { key: "phone", label: "تماس" },
        { key: "order", label: "ترتیب", type: "num" },
      ],
      fields: [
        { key: "name", label: "نام و نام خانوادگی", type: "text", required: true },
        { key: "role", label: "سمت / نقش", type: "text", hint: "مثال: نماینده فروش، مدیر اجرایی پروژه‌ها" },
        { key: "title", label: "شرح کوتاه نقش", type: "text" },
        { key: "city", label: "شهر", type: "text" },
        { key: "phone", label: "شماره تماس", type: "text" },
        { key: "email", label: "ایمیل", type: "text" },
        { key: "order", label: "ترتیب نمایش", type: "number" },
        { key: "badges", label: "تخصص‌ها (هر خط یک مورد)", type: "list", cls: L },
        { key: "bio", label: "معرفی کوتاه", type: "textarea", cls: L, rows: 3 },
        { key: "photo", label: "تصویر پرسنلی", type: "image", cls: L },
      ],
      empty: { name: "", role: "", title: "", city: "مشهد", phone: "", email: "", bio: "", badges: [], photo: "assets/img/agents/agent-1.svg", order: 99 },
    },

    articles: {
      title: "مقالات و آموزش‌ها",
      singular: "مقاله",
      columns: [
        { key: "image", label: "تصویر", type: "thumb" },
        { key: "title", label: "عنوان" },
        { key: "category", label: "دسته" },
        { key: "date", label: "تاریخ" },
        { key: "author", label: "نویسنده" },
      ],
      fields: [
        { key: "title", label: "عنوان مقاله", type: "text", required: true },
        { key: "category", label: "دسته‌بندی", type: "text" },
        { key: "author", label: "نویسنده", type: "text" },
        { key: "date", label: "تاریخ انتشار", type: "text", hint: "مثال: ۱۴۰۴/۰۲/۱۸" },
        { key: "readTime", label: "زمان مطالعه", type: "text", hint: "مثال: ۶ دقیقه" },
        { key: "excerpt", label: "خلاصه مقاله", type: "textarea", cls: L, rows: 2 },
        { key: "tags", label: "برچسب‌ها (هر خط یک مورد)", type: "list", cls: L },
        { key: "image", label: "تصویر شاخص", type: "image", cls: L },
        { key: "content", label: "متن مقاله (پشتیبانی از ## عنوان و - فهرست)", type: "textarea", cls: L, rows: 12 },
        { key: "slug", label: "نامک آدرس (اختیاری)", type: "text" },
      ],
      empty: { title: "", category: "آموزش", author: "تیم فنی", date: "۱۴۰۴/۰۳/۰۱", readTime: "۵ دقیقه", excerpt: "", tags: [], image: "assets/img/gallery/showroom-1.svg", content: "" },
    },

    gallery: {
      title: "گالری تصاویر",
      singular: "تصویر",
      orderBy: "order",
      columns: [
        { key: "image", label: "تصویر", type: "thumb" },
        { key: "title", label: "عنوان" },
        { key: "category", label: "دسته" },
        { key: "caption", label: "توضیح" },
        { key: "order", label: "ترتیب", type: "num" },
      ],
      fields: [
        { key: "title", label: "عنوان تصویر", type: "text", required: true },
        { key: "category", label: "دسته‌بندی", type: "text", hint: "ویلا، مسکونی، برج و تجاری، هتلی، نمایشگاه، آموزش…" },
        { key: "caption", label: "توضیح کوتاه", type: "text" },
        { key: "date", label: "تاریخ", type: "text" },
        { key: "order", label: "ترتیب نمایش", type: "number" },
        { key: "image", label: "فایل تصویر", type: "image", cls: L, required: true },
      ],
      empty: { title: "", category: "مسکونی", caption: "", date: "۱۴۰۴", image: "", order: 99 },
    },

    videos: {
      title: "ویدئوهای پروژه",
      singular: "ویدئو",
      orderBy: "order",
      columns: [
        { key: "poster", label: "تصویر", type: "thumb" },
        { key: "title", label: "عنوان" },
        { key: "category", label: "دسته" },
        { key: "src", label: "فایل ویدئو" },
        { key: "order", label: "ترتیب", type: "num" },
      ],
      fields: [
        { key: "title", label: "عنوان ویدئو", type: "text", required: true },
        { key: "category", label: "دسته‌بندی", type: "text", hint: "پروژه مسکونی، ویلایی، برج، تجاری…" },
        { key: "caption", label: "توضیح کوتاه", type: "text" },
        { key: "order", label: "ترتیب نمایش", type: "number" },
        { key: "src", label: "آدرس فایل ویدئو (mp4)", type: "text", cls: L, required: true, hint: "مثال: assets/media/project-1.mp4 — فایل را در پوشه public/assets/media بگذارید" },
        { key: "poster", label: "تصویر کاور (اختیاری)", type: "image", cls: L, hint: "یک فریم از ویدئو؛ اگر خالی باشد فقط دکمه پخش نمایش داده می‌شود" },
      ],
      empty: { title: "", category: "پروژه مسکونی", caption: "", src: "", poster: "", order: 99 },
    },
  };

  const state = {
    site: { settings: {}, products: [], agents: [], articles: [], gallery: [], videos: [] },
    messages: [],
    view: "overview",
    editing: null,
  };

  /* ------------------------------------------------------- auth */
  const token = () => localStorage.getItem(TOKEN_KEY);

  async function doLogin(e) {
    e.preventDefault();
    const errEl = $("#login-err");
    errEl.classList.remove("show");
    const btn = $("#login-btn");
    btn.disabled = true;
    btn.textContent = "در حال بررسی…";
    try {
      const data = await api("login", {
        method: "POST",
        body: { username: $("#username").value.trim(), password: $("#password").value },
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      await start();
    } catch (err) {
      errEl.textContent = err.message || "ورود ناموفق بود.";
      errEl.classList.add("show");
    } finally {
      btn.disabled = false;
      btn.textContent = "ورود به پنل";
    }
  }

  async function logout() {
    try {
      await api("logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    localStorage.removeItem(TOKEN_KEY);
    location.reload();
  }

  /* ------------------------------------------------------- data */
  async function refreshSite() {
    // read fresh from the API so admin edits are always authoritative
    const res = await fetch("/api/site", { cache: "no-store" });
    state.site = await res.json();
    return state.site;
  }

  async function refreshMessages() {
    try {
      state.messages = await api("messages");
    } catch {
      state.messages = [];
    }
  }

  function updateCounts() {
    const s = state.site;
    const map = {
      products: (s.products || []).length,
      agents: (s.agents || []).length,
      articles: (s.articles || []).length,
      gallery: (s.gallery || []).length,
      videos: (s.videos || []).length,
      unread: state.messages.filter((m) => !m.read).length,
    };
    $$("[data-count]").forEach((el) => {
      el.textContent = faDigits(map[el.dataset.count] ?? 0);
    });
    const kpis = [
      ["products", "محصول"],
      ["agents", "عضو تیم اجرایی"],
      ["articles", "مقاله و آموزش"],
      ["gallery", "تصویر در گالری"],
      ["videos", "ویدئوی پروژه"],
      ["messages", "پیام دریافتی"],
    ];
    $("#kpis").innerHTML = kpis
      .map(([k, label]) => {
        const n = k === "messages" ? state.messages.length : (s[k] || []).length;
        return `<div class="kpi"><b>${faDigits(n)}</b><span>${label}</span></div>`;
      })
      .join("");
  }

  /* ------------------------------------------------------- rendering */
  function listOf(key) {
    const arr = state.site[key] || [];
    const ob = SCHEMAS[key].orderBy;
    return ob ? [...arr].sort((a, b) => (+a[ob] || 0) - (+b[ob] || 0)) : [...arr];
  }

  function renderCollection(key) {
    const panel = $(`[data-panel="${key}"]`);
    const sc = SCHEMAS[key];
    const rows = listOf(key);

    panel.innerHTML = `
      <header class="admin-head">
        <div><h1>${sc.title}</h1><p>${faDigits(rows.length)} مورد ثبت شده — همه موارد از همین‌جا قابل ویرایش و حذف هستند.</p></div>
        <button class="btn btn--primary btn--sm" data-add="${key}">+ افزودن ${sc.singular}</button>
      </header>
      <div class="admin-toolbar">
        <input class="input grow" id="q-${key}" placeholder="جستجو در ${sc.title}…">
      </div>
      <div class="table-wrap">
        <div class="table-scroll">
          <table class="admin-table">
            <thead><tr>
              ${sc.columns.map((c) => `<th>${c.label}</th>`).join("")}
              <th style="width:110px">عملیات</th>
            </tr></thead>
            <tbody id="tb-${key}"></tbody>
          </table>
        </div>
      </div>`;

    const tbody = $(`#tb-${key}`);

    function paint(filter = "") {
      const list = rows.filter((r) =>
        !filter || JSON.stringify(r).toLowerCase().includes(filter.toLowerCase())
      );
      if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="${sc.columns.length + 1}"><div class="empty-state">موردی یافت نشد. با دکمه «افزودن ${sc.singular}» شروع کنید.</div></td></tr>`;
        return;
      }
      tbody.innerHTML = list
        .map((r) => {
          const cells = sc.columns
            .map((c) => {
              const v = r[c.key];
              if (c.type === "thumb") {
                return `<td>${v ? `<img class="cell-thumb" src="${asset(v)}" alt="">` : "<span class='muted'>—</span>"}</td>`;
              }
              if (c.type === "num") return `<td>${faDigits(v ?? "—")}</td>`;
              const text = String(v ?? "").trim() || "—";
              return `<td title="${escapeHtml(text)}">${escapeHtml(text.length > 46 ? text.slice(0, 46) + "…" : text)}</td>`;
            })
            .join("");
          return `<tr>
            ${cells}
            <td><div class="row-actions">
              <button class="mini-btn" data-edit="${key}" data-id="${r.id}" title="ویرایش">✎</button>
              <button class="mini-btn danger" data-del="${key}" data-id="${r.id}" title="حذف">🗑</button>
            </div></td>
          </tr>`;
        })
        .join("");
    }

    paint();
    const q = $(`#q-${key}`);
    q && q.addEventListener("input", () => paint(q.value));

    panel.querySelector("[data-add]").addEventListener("click", () => openEditor(key, null));
  }

  function renderMessages() {
    const panel = $('[data-panel="messages"]');
    panel.innerHTML = `
      <header class="admin-head">
        <div><h1>پیام‌های دریافتی</h1><p>پیام‌های فرم تماس سایت</p></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn--ghost btn--sm" id="msg-reload">به‌روزرسانی</button>
          <button class="btn btn--ghost btn--sm" id="msg-readall">همه خوانده شد</button>
          <button class="btn btn--danger btn--sm" id="msg-clear">پاک کردن همه</button>
        </div>
      </header>
      <div id="msg-list">
        ${
          state.messages.length
            ? state.messages
                .map(
                  (m) => `
          <div class="msg-item ${m.read ? "" : "unread"}" data-id="${escapeHtml(String(m.id))}">
            <div class="msg-top">
              <b>${escapeHtml(m.name)} ${m.subject ? `<span class="tag">${escapeHtml(m.subject)}</span>` : ""}</b>
              <span class="muted" style="font-size:.76rem">${escapeHtml(new Date(m.at).toLocaleString("fa-IR"))}</span>
            </div>
            <div class="muted" style="font-size:.8rem;direction:ltr;display:inline-block">${escapeHtml(m.phone)}${m.email ? " · " + escapeHtml(m.email) : ""}</div>
            <p class="msg-body">${escapeHtml(m.message)}</p>
            <div class="msg-actions">
              ${m.read ? "" : `<button class="btn btn--ghost btn--sm" data-markread="${escapeHtml(String(m.id))}">خوانده شد</button>`}
              <button class="btn btn--danger btn--sm" data-delmsg="${escapeHtml(String(m.id))}">حذف</button>
            </div>
          </div>`
                )
                .join("")
            : `<div class="admin-card"><div class="empty-state">هنوز پیامی ثبت نشده است.</div></div>`
        }
      </div>`;

    $("#msg-reload").addEventListener("click", async () => {
      await refreshMessages();
      renderMessages();
      updateCounts();
      toast("لیست پیام‌ها به‌روزرسانی شد.");
    });
    $("#msg-clear").addEventListener("click", async () => {
      if (!confirm("همه پیام‌ها حذف شوند؟ این عمل بازگشت‌پذیر نیست.")) return;
      await api("messages", { method: "DELETE" });
      await refreshMessages();
      renderMessages();
      updateCounts();
      toast("پیام‌ها پاک شدند.");
    });

    $("#msg-readall").addEventListener("click", async () => {
      await api("messages", { method: "PATCH", body: { read: true } });
      await refreshMessages();
      renderMessages();
      updateCounts();
      toast("همه پیام‌ها خوانده‌شده شدند.");
    });

    panel.querySelectorAll("[data-markread]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await api("messages/" + btn.dataset.markread, { method: "PATCH", body: { read: true } });
        await refreshMessages();
        renderMessages();
        updateCounts();
      });
    });

    panel.querySelectorAll("[data-delmsg]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("این پیام حذف شود؟")) return;
        await api("messages/" + btn.dataset.delmsg, { method: "DELETE" });
        await refreshMessages();
        renderMessages();
        updateCounts();
        toast("پیام حذف شد.");
      });
    });
  }

  /* ------------------------------------------------------- settings */
  function renderSettings() {
    const panel = $('[data-panel="settings"]');
    const s = state.site.settings || {};
    const stats = Array.isArray(s.stats) ? [...s.stats] : [];
    while (stats.length < 4) stats.push({ value: "", label: "" });

    panel.innerHTML = `
      <header class="admin-head"><div><h1>تنظیمات سایت</h1><p>اطلاعات پایه، تماس و شمارنده‌های صفحه اصلی</p></div></header>
      <form id="settings-form" class="admin-card">
        <h3>هویت و متن‌ها</h3>
        <div class="form-grid" style="margin-top:14px">
          <div class="field"><label>نام سایت</label><input class="input" name="siteName" value="${escapeHtml(s.siteName || "")}"></div>
          <div class="field"><label>برند</label><input class="input" name="brand" value="${escapeHtml(s.brand || "")}"></div>
          <div class="field full"><label>شعار / زیرنویس لوگو</label><input class="input" name="tagline" value="${escapeHtml(s.tagline || "")}"></div>
          <div class="field full"><label>نشان بالای هدر (badge)</label><input class="input" name="heroBadge" value="${escapeHtml(s.heroBadge || "")}"></div>
          <div class="field full"><label>تیتر اصلی صفحه خانه</label><input class="input" name="heroTitle" value="${escapeHtml(s.heroTitle || "")}"></div>
          <div class="field full"><label>توضیح زیر تیتر</label><textarea class="textarea" name="heroSubtitle" rows="2">${escapeHtml(s.heroSubtitle || "")}</textarea></div>
          <div class="field full"><label>درباره ما (فوتر)</label><textarea class="textarea" name="about" rows="3">${escapeHtml(s.about || "")}</textarea></div>
        </div>

        <h3 style="margin-top:26px">اطلاعات تماس</h3>
        <div class="form-grid" style="margin-top:14px">
          <div class="field"><label>تلفن (نمایش)</label><input class="input" name="phone" value="${escapeHtml(s.phone || "")}"></div>
          <div class="field"><label>تلفن (لینک tel)</label><input class="input" name="phoneRaw" dir="ltr" value="${escapeHtml(s.phoneRaw || "")}"></div>
          <div class="field"><label>واتس‌اپ (با کد کشور)</label><input class="input" name="whatsapp" dir="ltr" value="${escapeHtml(s.whatsapp || "")}"></div>
          <div class="field"><label>ایمیل</label><input class="input" name="email" dir="ltr" value="${escapeHtml(s.email || "")}"></div>
          <div class="field full"><label>آدرس</label><input class="input" name="address" value="${escapeHtml(s.address || "")}"></div>
          <div class="field full"><label>ساعت کاری</label><input class="input" name="hours" value="${escapeHtml(s.hours || "")}"></div>
        </div>

        <h3 style="margin-top:26px">شمارنده‌های صفحه خانه</h3>
        <div class="form-grid" style="margin-top:14px" id="stats-fields">
          ${stats
            .map(
              (st, i) => `
            <div class="field"><label>عدد ${faDigits(i + 1)}</label><input class="input" name="stat-v-${i}" value="${escapeHtml(st.value || "")}"></div>
            <div class="field"><label>برچسب ${faDigits(i + 1)}</label><input class="input" name="stat-l-${i}" value="${escapeHtml(st.label || "")}"></div>`
            )
            .join("")}
        </div>

        <div style="margin-top:24px;display:flex;gap:10px">
          <button class="btn btn--primary" type="submit">ذخیره تنظیمات</button>
          <span class="form-note" id="settings-note" style="align-self:center">تغییرات بلافاصله روی سایت اعمال می‌شود.</span>
        </div>
      </form>`;

    $("#settings-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const patch = {};
      for (const [k, v] of fd.entries()) {
        if (k.startsWith("stat-")) continue;
        patch[k] = v;
      }
      patch.stats = stats.map((_, i) => ({
        value: fd.get(`stat-v-${i}`) || "",
        label: fd.get(`stat-l-${i}`) || "",
      }));
      try {
        await api("settings", { method: "PUT", body: patch });
        await refreshSite();
        toast("تنظیمات ذخیره شد ✅");
        $("#settings-note").textContent = "ذخیره شد ✅";
      } catch (err) {
        toast("خطا: " + err.message);
      }
    });
  }

  /* ------------------------------------------------------- editor */
  function openEditor(key, id) {
    const sc = SCHEMAS[key];
    const isNew = !id;
    const base = isNew ? { ...sc.empty } : listOf(key).find((x) => String(x.id) === String(id));
    if (!base) return;
    state.editing = { key, id, data: JSON.parse(JSON.stringify(base)) };

    $("#modal-title").textContent = `${isNew ? "افزودن" : "ویرایش"} ${sc.singular}`;
    const form = $("#modal-form");
    form.innerHTML = sc.fields
      .map((f) => {
        const val = base[f.key] ?? "";
        const cls = f.cls === L ? "field full" : "field";
        if (f.type === "textarea") {
          return `<div class="${cls}"><label>${f.label}</label><textarea class="textarea" name="${f.key}" rows="${f.rows || 3}">${escapeHtml(val)}</textarea>${f.hint ? `<small>${f.hint}</small>` : ""}</div>`;
        }
        if (f.type === "number") {
          return `<div class="${cls}"><label>${f.label}</label><input class="input" type="number" name="${f.key}" value="${escapeHtml(val)}"></div>`;
        }
        if (f.type === "list") {
          return `<div class="${cls}"><label>${f.label}</label><textarea class="textarea" name="${f.key}" rows="3">${escapeHtml((val || []).join("\n"))}</textarea></div>`;
        }
        if (f.type === "specs") {
          const txt = (val || []).map((x) => `${x.k} | ${x.v}`).join("\n");
          return `<div class="${cls}"><label>${f.label}</label><textarea class="textarea" name="${f.key}" rows="4" placeholder="ولتاژ | ۲۲۰ ولت">${escapeHtml(txt)}</textarea><small>هر خط یک مشخصه، کلید و مقدار را با علامت | جدا کنید.</small></div>`;
        }
        if (f.type === "image") {
          return `<div class="${cls}">
            <label>${f.label}</label>
            <input class="input" name="${f.key}" value="${escapeHtml(val)}" placeholder="assets/img/…" dir="ltr">
            <div class="upload-row">
              <input type="file" accept="image/*" data-upload="${f.key}">
              <button type="button" class="btn btn--ghost btn--sm" data-pick="${f.key}">انتخاب از کتابخانه</button>
            </div>
            <small class="muted">حداکثر حجم فایل: ${MAX_UPLOAD_LABEL}</small>
            <div class="img-preview" data-preview="${f.key}">${val ? `<img src="${asset(val)}" alt="">` : "پیش‌نمایش تصویر"}</div>
          </div>`;
        }
        return `<div class="${cls}"><label>${f.label}${f.required ? " *" : ""}</label><input class="input" name="${f.key}" value="${escapeHtml(val)}">${f.hint ? `<small>${f.hint}</small>` : ""}</div>`;
      })
      .join("");

    // image preview + upload
    form.querySelectorAll("input[data-upload]").forEach((input) => {
      input.addEventListener("change", async () => {
        const file = input.files[0];
        if (!file) return;
        const fieldKey = input.dataset.upload;
        if (file.size > MAX_UPLOAD) {
          toast(`حجم فایل ${faSize(file.size)} است؛ حداکثر ${MAX_UPLOAD_LABEL}.`, 4200);
          input.value = "";
          return;
        }
        try {
          toast("در حال آپلود…");
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${token()}`, "x-filename": file.name },
            body: file,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "آپلود ناموفق");
          const nameInput = form.querySelector(`[name="${fieldKey}"]`);
          nameInput.value = data.url;
          const prev = form.querySelector(`[data-preview="${fieldKey}"]`);
          prev.innerHTML = `<img src="${data.url}" alt="">`;
          toast("تصویر آپلود شد ✅");
        } catch (err) {
          toast("خطا در آپلود: " + err.message);
        }
      });
    });

    form.querySelectorAll("[data-pick]").forEach((btn) => {
      btn.addEventListener("click", () => openLibrary(btn.dataset.pick));
    });

    $("#modal").classList.add("open");
    document.body.style.overflow = "hidden";
    const first = form.querySelector("input,textarea");
    first && first.focus();
  }

  function closeEditor() {
    $("#modal").classList.remove("open");
    document.body.style.overflow = "";
    state.editing = null;
  }

  async function saveEditor(e) {
    e.preventDefault();
    if (!state.editing) return;
    const { key, id } = state.editing;
    const sc = SCHEMAS[key];
    const fd = new FormData(e.target);
    const payload = {};

    for (const f of sc.fields) {
      const raw = fd.get(f.key);
      if (f.type === "number") payload[f.key] = Number(raw) || 0;
      else if (f.type === "list") payload[f.key] = String(raw || "").split("\n").map((x) => x.trim()).filter(Boolean);
      else if (f.type === "specs")
        payload[f.key] = String(raw || "")
          .split("\n")
          .map((line) => line.split("|"))
          .filter((p) => p[0] && p[0].trim())
          .map((p) => ({ k: (p[0] || "").trim(), v: (p[1] || "").trim() }));
      else payload[f.key] = String(raw ?? "").trim();
    }

    for (const f of sc.fields) {
      if (f.required && !payload[f.key]) {
        toast(`«${f.label}» الزامی است.`);
        return;
      }
    }

    const btn = $("#modal-save");
    btn.disabled = true;
    btn.textContent = "در حال ذخیره…";
    try {
      if (id) await api(`${key}/${id}`, { method: "PUT", body: payload });
      else await api(key, { method: "POST", body: payload });
      await refreshSite();
      renderCollection(key);
      updateCounts();
      closeEditor();
      toast("ذخیره شد ✅");
    } catch (err) {
      toast("خطا در ذخیره: " + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "ذخیره";
    }
  }

  async function removeItem(key, id) {
    const item = listOf(key).find((x) => String(x.id) === String(id));
    const label = item ? item.title || item.name || "" : "";
    if (!confirm(`«${label}» حذف شود؟`)) return;
    try {
      await api(`${key}/${id}`, { method: "DELETE" });
      await refreshSite();
      renderCollection(key);
      updateCounts();
      toast("حذف شد.");
    } catch (err) {
      toast("خطا در حذف: " + err.message);
    }
  }

  /* ------------------------------------------------------- library */
  function openLibrary(fieldKey) {
    const imgs = [];
    const push = (p) => p && imgs.push(p);
    (state.site.products || []).forEach((p) => push(p.image));
    (state.site.gallery || []).forEach((g) => push(g.image));
    (state.site.agents || []).forEach((a) => push(a.photo));
    (state.site.articles || []).forEach((a) => push(a.image));
    (state.site.videos || []).forEach((v) => push(v.poster));
    const uniq = Array.from(new Set(imgs));

    let picker = $("#lib-picker");
    if (picker) picker.remove();
    picker = document.createElement("div");
    picker.id = "lib-picker";
    picker.className = "modal open";
    picker.innerHTML = `
      <div class="modal-box">
        <header class="modal-head"><h3>کتابخانه تصاویر</h3><button class="icon-btn" data-lib-close>✕</button></header>
        <div class="modal-body" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));display:grid">
          ${uniq
            .map(
              (u) => `<button type="button" data-lib-url="${escapeHtml(u)}" style="padding:0;border:1px solid var(--line);border-radius:10px;overflow:hidden;background:none;cursor:pointer">
                        <img src="${asset(u)}" alt="" style="width:100%;height:80px;object-fit:cover">
                      </button>`
            )
            .join("")}
        </div>
      </div>`;
    document.body.appendChild(picker);
    picker.addEventListener("click", (e) => {
      if (e.target === picker || e.target.closest("[data-lib-close]")) {
        picker.remove();
        return;
      }
      const b = e.target.closest("[data-lib-url]");
      if (!b) return;
      const url = b.dataset.libUrl;
      const form = $("#modal-form");
      form.querySelector(`[name="${fieldKey}"]`).value = url;
      form.querySelector(`[data-preview="${fieldKey}"]`).innerHTML = `<img src="${asset(url)}" alt="">`;
      picker.remove();
    });
  }

  /* ------------------------------------------------------- views */
  function show(view) {
    state.view = view;
    $$(".admin-link").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    $$(".admin-panel").forEach((p) => (p.hidden = p.dataset.panel !== view));
    if (view === "overview") updateCounts();
    if (SCHEMAS[view]) renderCollection(view);
    if (view === "messages") renderMessages();
    if (view === "settings") renderSettings();
    if (location.hash.slice(1) !== view) history.replaceState(null, "", "#" + view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ------------------------------------------------------- boot */
  async function start() {
    $("#login-view").hidden = true;
    $("#admin-view").hidden = false;
    try {
      const session = await api("session");
      $("#admin-user").textContent = `کاربر: ${session.user}`;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      $("#login-view").hidden = false;
      $("#admin-view").hidden = true;
      return;
    }
    await refreshSite();
    await refreshMessages();
    updateCounts();
    const hash = location.hash.slice(1);
    const valid = ["overview", "messages", "settings"].concat(Object.keys(SCHEMAS));
    show(valid.includes(hash) ? hash : "overview");
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("#login-form").addEventListener("submit", doLogin);
    $("#logout").addEventListener("click", logout);
    $("#modal-close").addEventListener("click", closeEditor);
    $("#modal-cancel").addEventListener("click", closeEditor);
    $("#modal-form").addEventListener("submit", saveEditor);
    $("#modal").addEventListener("click", (e) => {
      if (e.target === $("#modal")) closeEditor();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && $("#modal").classList.contains("open")) closeEditor();
    });

    $("#admin-nav").addEventListener("click", (e) => {
      const b = e.target.closest(".admin-link");
      if (b) show(b.dataset.view);
    });

    document.addEventListener("click", (e) => {
      const add = e.target.closest("[data-add]");
      if (add) return openEditor(add.dataset.add, null);
      const quick = e.target.closest("[data-quick]");
      if (quick) {
        show(quick.dataset.quick);
        openEditor(quick.dataset.quick, null);
        return;
      }
      const edit = e.target.closest("[data-edit]");
      if (edit) return openEditor(edit.dataset.edit, edit.dataset.id);
      const del = e.target.closest("[data-del]");
      if (del) return removeItem(del.dataset.del, del.dataset.id);
    });

    if (token()) start();
  });
})();
