/* ==========================================================================
   core.js — زیرساخت مشترک سایت خانه هوشمند مشهد
   ========================================================================== */
(function (global) {
  "use strict";

  /* ---------------------------------------------------------- icons */
  const ICONS = {
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" stroke-linejoin="round"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2.5 6.5 9.5 7 9.5-7"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9.5"/><path d="M12 7v5.5l3.5 2"/>',
    whatsapp: '<path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.5-4.4A8.4 8.4 0 1 1 20.5 11.6z"/><path d="M8.7 9.1c.2-.5.4-.5.7-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .4-.1.5l-.4.5c-.1.1-.2.3-.1.5.4.7 1.4 1.7 2.1 2.1.2.1.4 0 .5-.1l.5-.4c.1-.1.3-.2.5-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3 0 .5-.5.7-.6.3-1.6.4-2.6 0-1-.4-2.3-1.2-3.3-2.2s-1.8-2.3-2.2-3.3c-.4-1-.3-2 0-2.6z" stroke-linejoin="round"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>',
    telegram: '<path d="M21.5 4.3 2.9 11.2c-.9.3-.9 1.5.1 1.7l4.6 1.2 1.7 5.3c.2.7 1.1.9 1.6.3l2.5-2.6 4.6 3.4c.7.5 1.7.1 1.9-.7l3-13.9c.2-.9-.7-1.6-1.5-1.3z" stroke-linejoin="round"/><path d="m7.6 14.1 9.4-6.4-6.9 7.2"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 10.5V17M8 7.5v.01M12 17v-3.6c0-1.4 2-1.9 2.6-.6V17"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="m11 6-6 6 6 6"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    check: '<path d="m4 12.5 5 5L20 6.5"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    shield: '<path d="M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3z"/><path d="m9 12 2 2 4-4"/>',
    bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l1-8z" stroke-linejoin="round"/>',
    home: '<path d="M4 10.5 12 3l8 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 20v-9.5z"/><path d="M9.5 21.5V14h5v7.5"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
    wifi: '<path d="M2.5 8.5a15 15 0 0 1 19 0M6 12a10 10 0 0 1 12 0M9.5 15.5a5 5 0 0 1 5 0"/><circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none"/>',
    sliders: '<path d="M4 8h10M18 8h2M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2"/><circle cx="10" cy="16" r="2"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v18H6.5A2.5 2.5 0 0 1 4 18.5v-13z"/><path d="M8 7h7M8 11h7"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 4 4 3-2.5L20 18"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M3 20c0-3.2 2.7-5.4 6-5.4s6 2.2 6 5.4"/><path d="M16.5 5.2a3.2 3.2 0 0 1 0 6.1M18 14.8c2 .6 3.3 2.3 3.3 4.4"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
    tag: '<path d="M12.5 3H20v7.5L11 21l-8-8 9.5-10z" stroke-linejoin="round"/><circle cx="16.4" cy="7.6" r="1.4"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    up: '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
    download: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>',
    send: '<path d="M21 3 10.5 13.5"/><path d="M21 3l-6.5 18-4-7.5L3 9.5 21 3z" stroke-linejoin="round"/>',
    play: '<circle cx="12" cy="12" r="9.5"/><path d="m10 8.5 6 3.5-6 3.5v-7z" stroke-linejoin="round"/>',
    thermometer: '<path d="M14 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0z"/><circle cx="12" cy="17" r="1.6" fill="currentColor" stroke="none"/>',
    lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.8V16h7v-2.2A6 6 0 0 0 12 3z" stroke-linejoin="round"/>',
  };

  function icon(name, cls) {
    const path = ICONS[name] || ICONS.spark;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"${cls ? ` class="${cls}"` : ""} aria-hidden="true">${path}</svg>`;
  }

  /* ---------------------------------------------------------- helpers */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const faDigits = (v) =>
    String(v ?? "").replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);

  const escapeHtml = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const asset = (p) => {
    if (!p) return "";
    if (/^(https?:)?\/\//.test(p) || p.startsWith("data:")) return p;
    return p.replace(/^\.?\//, "");
  };

  const setMeta = (name, content) => {
    let el = document.querySelector(`meta[name="${name}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  /* ---------------------------------------------------------- API */
  const TOKEN_KEY = "bms.admin.token";

  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body && !(options.body instanceof Blob) && typeof options.body !== "string") {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(`/api/${path}`, { ...options, headers });
    const type = res.headers.get("content-type") || "";
    const data = type.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
      const err = new Error((data && data.error) || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  /* ---------------------------------------------------------- data */
  const DATA_SOURCES = ["data/site.json", "../data/site.json"];
  let cache = null;

  async function loadSite() {
    if (cache) return cache;
    let lastErr;
    for (const src of DATA_SOURCES) {
      try {
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        cache = await res.json();
        return cache;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error("عدم دسترسی به داده سایت");
  }

  const sorted = (arr = []) => [...arr].sort((a, b) => (+a.order || 0) - (+b.order || 0));

  /* ---------------------------------------------------------- chrome */
  const NAV = [
    { href: "index.html", label: "خانه", key: "home" },
    { href: "products.html", label: "محصولات کوباکو", key: "products" },
    { href: "agents.html", label: "عوامل اجرایی", key: "agents" },
    { href: "articles.html", label: "مقالات و آموزش‌ها", key: "articles" },
    { href: "gallery.html", label: "گالری تصاویر", key: "gallery" },
    { href: "contact.html", label: "تماس با ما", key: "contact" },
  ];

  function renderChrome(site, active) {
    const s = site.settings || {};
    const placeholder = $("#site-header");
    if (placeholder) {
      placeholder.innerHTML = `
      <div class="topbar">
        <div class="wrap">
          <div class="topbar-links">
            <a href="tel:${escapeHtml(s.phoneRaw || "")}">${icon("phone")}<span>${escapeHtml(s.phone || "")}</span></a>
            <a href="mailto:${escapeHtml(s.email || "")}">${icon("mail")}<span dir="ltr">${escapeHtml(s.email || "")}</span></a>
          </div>
          <div class="topbar-links">
            <span>${icon("clock")}${escapeHtml(s.hours || "")}</span>
            <a href="admin.html">${icon("lock")}<span>ورود مدیریت</span></a>
          </div>
        </div>
      </div>
      <div class="wrap">
        <nav class="nav" aria-label="ناوبری اصلی">
          <a class="brand" href="index.html">
            <img src="assets/img/cobaco/logo-white.png" alt="لوگوی خانه هوشمند مشهد">
            <span class="brand-text">
              <strong>${escapeHtml(s.siteName || "خانه هوشمند مشهد")}</strong>
              <span>${escapeHtml(s.tagline || "")}</span>
            </span>
          </a>
          <div class="nav-links" id="nav-links">
            ${NAV.map((n) => `<a href="${n.href}" class="${n.key === active ? "active" : ""}">${n.label}</a>`).join("")}
          </div>
          <div class="nav-actions">
            <a class="btn btn--primary btn--sm" href="contact.html">${icon("phone")}درخواست مشاوره</a>
            <button class="nav-toggle" id="nav-toggle" aria-label="منو">${icon("menu")}</button>
          </div>
        </nav>
      </div>`;
      const toggle = $("#nav-toggle");
      toggle && toggle.addEventListener("click", () => $("#nav-links").classList.toggle("open"));
    }

    const footer = $("#site-footer");
    if (footer) {
      const year = new Date().getFullYear();
      footer.innerHTML = `
      <div class="wrap">
        <div class="footer-grid">
          <div class="footer-about">
            <a class="brand" href="index.html">
              <img src="assets/img/cobaco/logo-white.png" alt="">
              <span class="brand-text">
                <strong>${escapeHtml(s.siteName || "")}</strong>
                <span>${escapeHtml(s.brand || "کوباکو")} · مشهد</span>
              </span>
            </a>
            <p>${escapeHtml((s.about || "").slice(0, 210))}…</p>
            <div class="socials">
              ${(s.socials || []).map((so) => `<a class="icon-btn" href="${escapeHtml(so.url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(so.label)}">${icon(so.icon)}</a>`).join("")}
            </div>
          </div>
          <div>
            <h4>دسترسی سریع</h4>
            <ul>${NAV.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join("")}</ul>
          </div>
          <div>
            <h4>محصولات</h4>
            <ul>${sorted(site.products).slice(0, 6).map((p) => `<li><a href="product.html?slug=${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a></li>`).join("")}</ul>
          </div>
          <div>
            <h4>تماس با ما</h4>
            <ul>
              <li>${icon("pin")} ${escapeHtml(s.address || "")}</li>
              <li><a href="tel:${escapeHtml(s.phoneRaw || "")}">${escapeHtml(s.phone || "")}</a></li>
              <li><a href="mailto:${escapeHtml(s.email || "")}" dir="ltr">${escapeHtml(s.email || "")}</a></li>
              <li>${escapeHtml(s.hours || "")}</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${faDigits(year)} ${escapeHtml(s.siteName || "")} — تمامی حقوق محفوظ است.</span>
          <span>نمایندگی رسمی محصولات ${escapeHtml(s.brand || "کوباکو")} در مشهد</span>
        </div>
      </div>`;
    }

    const up = document.createElement("button");
    up.className = "to-top";
    up.setAttribute("aria-label", "بازگشت به بالا");
    up.innerHTML = icon("up");
    document.body.appendChild(up);
    up.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

    const onScroll = () => {
      const y = window.scrollY;
      const header = $("#site-header");
      header && header.classList.toggle("is-scrolled", y > 8);
      up.classList.toggle("show", y > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------- reveal */
  function reveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window) || !els.length) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e, i) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add("in"), i * 60);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px" }
    );
    els.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------- toast */
  function toast(message, ms = 3200) {
    let el = $(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), ms);
  }

  /* ---------------------------------------------------------- cards */
  /* real photos are cut-outs on transparency -> render them on a light plate */
  const isPhoto = (src) => /\.(png|jpe?g|webp|avif|gif)$/i.test(String(src || ""));

  const productCard = (p) => `
    <article class="card product-card reveal">
      <a class="product-media ${isPhoto(p.image) ? "is-photo" : "is-cover"}" href="product.html?slug=${encodeURIComponent(p.slug)}">
        <img src="${asset(p.image)}" alt="${escapeHtml(p.title)}" loading="lazy">
        <span class="chip">${escapeHtml(p.category)}</span>
        ${p.badge ? `<span class="badge-flag">${escapeHtml(p.badge)}</span>` : ""}
      </a>
      <div class="product-body">
        <h3><a href="product.html?slug=${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a></h3>
        <p>${escapeHtml(p.summary)}</p>
        <a class="card-link" href="product.html?slug=${encodeURIComponent(p.slug)}">جزئیات محصول ${icon("arrowLeft")}</a>
      </div>
    </article>`;

  const agentCard = (a) => `
    <article class="card agent-card reveal">
      <div class="agent-photo"><img src="${asset(a.photo)}" alt="${escapeHtml(a.name)}" loading="lazy"></div>
      <h3>${escapeHtml(a.name)}</h3>
      <div class="agent-role">${escapeHtml(a.role)}</div>
      <p class="agent-title">${escapeHtml(a.title)}</p>
      <div class="agent-badges">${(a.badges || []).map((b) => `<span class="tag">${escapeHtml(b)}</span>`).join("")}</div>
      <div class="agent-contact">
        ${a.phone ? `<a class="icon-btn" href="tel:${escapeHtml(a.phone.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)))}" title="تماس">${icon("phone")}</a>` : ""}
        ${a.email ? `<a class="icon-btn" href="mailto:${escapeHtml(a.email)}" title="ایمیل">${icon("mail")}</a>` : ""}
        <button class="icon-btn" data-copy="${escapeHtml(a.phone)}" title="کپی شماره">${icon("check")}</button>
      </div>
    </article>`;

  const articleCard = (a) => `
    <article class="card article-card reveal">
      <a class="article-media" href="article.html?slug=${encodeURIComponent(a.slug)}">
        <img src="${asset(a.image)}" alt="${escapeHtml(a.title)}" loading="lazy">
        <span class="chip">${escapeHtml(a.category)}</span>
      </a>
      <div class="article-body">
        <div class="meta">
          <span>${icon("calendar")}${escapeHtml(a.date)}</span>
          <span>${icon("clock")}${escapeHtml(a.readTime)}</span>
        </div>
        <h3><a href="article.html?slug=${encodeURIComponent(a.slug)}">${escapeHtml(a.title)}</a></h3>
        <p>${escapeHtml(a.excerpt)}</p>
        <a class="card-link" href="article.html?slug=${encodeURIComponent(a.slug)}">ادامه مطلب ${icon("arrowLeft")}</a>
      </div>
    </article>`;

  /* project video: click-to-play so the big mp4 is never fetched up front */
  const videoCard = (v) => `
    <figure class="video-card reveal">
      <button class="video-shell" type="button"
              data-src="${asset(v.src)}"
              data-title="${escapeHtml(v.title)}"
              aria-label="پخش ویدئوی ${escapeHtml(v.title)}">
        ${v.poster ? `<img src="${asset(v.poster)}" alt="${escapeHtml(v.title)}" loading="lazy">` : ""}
        <span class="video-play" aria-hidden="true">${icon("play")}</span>
        <span class="cat">${escapeHtml(v.category)}</span>
      </button>
      <figcaption class="video-cap">
        <strong>${escapeHtml(v.title)}</strong>
        ${v.caption ? `<small>${escapeHtml(v.caption)}</small>` : ""}
      </figcaption>
    </figure>`;

  /* swap the poster for a real <video> only when the user asks for it */
  function initVideoCards() {
    $$(".video-shell").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.loaded) return;
        const v = document.createElement("video");
        v.className = "video-el";
        v.src = btn.dataset.src;
        v.controls = true;
        v.autoplay = true;
        v.playsInline = true;
        v.preload = "auto";
        const poster = $("img", btn);
        if (poster) poster.remove();
        const play = $(".video-play", btn);
        if (play) play.remove();
        btn.dataset.loaded = "1";
        btn.classList.add("playing");
        btn.insertBefore(v, btn.firstChild);
      });
    });
  }

  const galleryItem = (g) => `
    <figure class="gallery-item reveal" data-cat="${escapeHtml(g.category)}" data-full="${asset(g.image)}" data-title="${escapeHtml(g.title)}" data-caption="${escapeHtml(g.caption)}" tabindex="0">
      <img src="${asset(g.image)}" alt="${escapeHtml(g.title)}" loading="lazy">
      <span class="cat">${escapeHtml(g.category)}</span>
      <figcaption class="gallery-cap">
        <strong>${escapeHtml(g.title)}</strong>
        <small>${escapeHtml(g.caption)}</small>
      </figcaption>
    </figure>`;

  /* ---------------------------------------------------------- lightbox */
  function initLightbox() {
    const box = document.createElement("div");
    box.className = "lightbox";
    box.innerHTML = `
      <button class="lightbox-close" aria-label="بستن">${icon("close")}</button>
      <figure><img alt=""><figcaption></figcaption></figure>`;
    document.body.appendChild(box);

    const img = $("img", box);
    const cap = $("figcaption", box);
    const open = (src, title, caption) => {
      img.src = src;
      img.alt = title;
      cap.innerHTML = `<strong>${escapeHtml(title)}</strong>${caption ? `<div>${escapeHtml(caption)}</div>` : ""}`;
      box.classList.add("open");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      box.classList.remove("open");
      document.body.style.overflow = "";
    };
    $(".lightbox-close", box).addEventListener("click", close);
    box.addEventListener("click", (e) => {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    document.addEventListener("click", (e) => {
      const item = e.target.closest(".gallery-item");
      if (!item) return;
      open(item.dataset.full, item.dataset.title, item.dataset.caption);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const item = document.activeElement && document.activeElement.closest(".gallery-item");
      if (item) open(item.dataset.full, item.dataset.title, item.dataset.caption);
    });
  }

  /* ---------------------------------------------------------- copy phone */
  function initCopy() {
    document.addEventListener("click", async (e) => {
      const btn = e.target.closest("[data-copy]");
      if (!btn) return;
      const text = btn.dataset.copy;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        toast("شماره تماس کپی شد ✅");
      } catch {
        toast(text);
      }
    });
  }

  /* ---------------------------------------------------------- simple md */
  function renderMarkdown(text) {
    const lines = String(text || "").replace(/\r/g, "").split("\n");
    const out = [];
    let list = null;
    const inline = (s) =>
      escapeHtml(s)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/`(.+?)`/g, "<code>$1</code>")
        .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    const flush = () => {
      if (list) {
        out.push(`<ul>${list.join("")}</ul>`);
        list = null;
      }
    };
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) {
        flush();
        continue;
      }
      if (/^###\s+/.test(line)) {
        flush();
        out.push(`<h3>${inline(line.replace(/^###\s+/, ""))}</h3>`);
      } else if (/^##\s+/.test(line)) {
        flush();
        out.push(`<h2>${inline(line.replace(/^##\s+/, ""))}</h2>`);
      } else if (/^#\s+/.test(line)) {
        flush();
        out.push(`<h2>${inline(line.replace(/^#\s+/, ""))}</h2>`);
      } else if (/^[-*•]\s+/.test(line)) {
        list = list || [];
        list.push(`<li>${inline(line.replace(/^[-*•]\s+/, ""))}</li>`);
      } else if (/^---+$/.test(line)) {
        flush();
        out.push("<hr>");
      } else {
        flush();
        out.push(`<p>${inline(line)}</p>`);
      }
    }
    flush();
    return out.join("\n");
  }

  function extractHeadings(text) {
    return String(text || "")
      .replace(/\r/g, "")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /^#{2,3}\s+/.test(l))
      .map((l, i) => ({ id: `h-${i}`, text: l.replace(/^#{2,3}\s+/, "") }));
  }

  /* ---------------------------------------------------------- boot */
  async function boot(preset) {
    try {
      const site = await loadSite();
      renderChrome(site, document.body.dataset.page);
      initLightbox();
      initCopy();
      if (typeof preset === "function") preset(site);
      reveal();
      return site;
    } catch (err) {
      console.error(err);
      const main = $("#app") || document.body;
      main.insertAdjacentHTML(
        "beforeend",
        `<div class="wrap section"><div class="alert alert--err show">خطا در بارگذاری داده سایت. 페이지 را از طریق سرور (<code>node server.js</code>) باز کنید: ${escapeHtml(err.message)}</div></div>`
      );
    }
  }

  global.App = {
    icon,
    $,
    $$,
    faDigits,
    escapeHtml,
    asset,
    setMeta,
    api,
    loadSite,
    sorted,
    toast,
    reveal,
    productCard,
    isPhoto,
    agentCard,
    articleCard,
    galleryItem,
    videoCard,
    initVideoCards,
    renderMarkdown,
    extractHeadings,
    boot,
    TOKEN_KEY,
  };
})(window);
