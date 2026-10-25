/* ==========================================================================
   MOONLIGHT STUDIOS — site script
   Builds the header, footer and all data-driven pages from js/data.js.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- where is the site root? Pages live in folders (games/, contact/ ...), so work it out from this script's own address ---------- */
  const ROOT = (() => {
    try { const src = document.currentScript && document.currentScript.src; return src ? new URL("../", src).href : "/"; } catch (e) { return "/"; }
  })();
  const CLEAN = location.protocol !== "file:"; // opened straight from a folder: add index.html so links still work
  const href = (p) => ROOT + (CLEAN ? p : p === "" || p.endsWith("/") ? p + "index.html" : p);
  const asset = (p) => (!p || /^([a-z][a-z0-9+.-]*:|\/)/i.test(p) ? p : ROOT + p);
  const gameUrl = (slug) => href("game/") + "?g=" + encodeURIComponent(slug);
  const logUrl = (slug) => href("devlog/") + "?p=" + encodeURIComponent(slug);
  const logsUrl = (filter) => href("devlogs/") + (filter ? "?filter=" + encodeURIComponent(filter) : "");


  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const params = new URLSearchParams(location.search);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- data safety: a typo in js/data.js must never blank the whole site ---------- */
  const problems = [];
  const hasSite = typeof SITE !== "undefined", hasGames = typeof GAMES !== "undefined", hasLogs = typeof DEVLOGS !== "undefined";
  const dataBroken = !(hasSite && hasGames && hasLogs);
  const arr = (v) => (Array.isArray(v) ? v : v == null || v === "" ? [] : [v]);
  const DATA_SITE = Object.assign({ email: "", formEndpoint: "", replyTo: "" }, hasSite ? SITE : {});
  DATA_SITE.socials = DATA_SITE.socials || {};
  const gameDefaults = { subtitle: "", status: "", statusKey: "upcoming", hue: 235, tagline: "", short: "", itch: "", cover: "", hero: "", showcase: "", logo: "" };
  const DATA_GAMES = (hasGames ? arr(GAMES) : [])
    .filter((g, i) => { const ok = g && g.slug && g.title; if (!ok) problems.push(`GAMES entry #${i + 1} needs a slug and a title, so it was skipped.`); return ok; })
    .map((g) => Object.assign({}, gameDefaults, g, { description: arr(g.description), features: arr(g.features), facts: arr(g.facts), screenshots: arr(g.screenshots), videos: arr(g.videos) }));
  const logDefaults = { game: "general", excerpt: "", cover: "" };
  const seenSlugs = {};
  const DATA_DEVLOGS = (hasLogs ? arr(DEVLOGS) : [])
    .filter((l, i) => {
      const ok = l && l.slug && l.title && /^\d{4}-\d{2}-\d{2}$/.test(l.date || "");
      if (!ok) problems.push(`DEVLOGS entry #${i + 1}${l && l.title ? ` ("${l.title}")` : ""} needs a slug, a title and a date like 2026-10-16, so it was skipped.`);
      else if (seenSlugs[l.slug]) { problems.push(`Two devlogs share the slug "${l.slug}". Each one needs its own.`); }
      if (ok) seenSlugs[l.slug] = true;
      return ok;
    })
    .map((l) => Object.assign({}, logDefaults, l, { body: arr(l.body).filter(Boolean) }));
  DATA_DEVLOGS.forEach((l) => {
    if (l.game !== "general" && !DATA_GAMES.some((g) => g.slug === l.game)) problems.push(`Devlog "${l.title}" has game: "${l.game}", which doesn't match any game slug (use "general" for studio news).`);
  });
  function alertData() {
    if (problems.length) console.warn("Moonlight site, problems in js/data.js:\n- " + problems.join("\n- "));
    const local = location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(location.hostname) || params.has("debug");
    let msg = "";
    if (dataBroken) msg = "js/data.js could not be read. This is almost always a typo: a missing comma, a missing closing bracket, or a double quote inside text. Press F12 and open the Console tab to see the exact line.";
    else if (problems.length && local) msg = "Problems in js/data.js: " + problems.join(" ");
    if (!msg) return;
    const d = document.createElement("div");
    d.setAttribute("role", "alert");
    d.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:300;background:#3b1020;color:#ffd6dc;padding:.9rem 1.2rem;border-top:1px solid #ff7b8f;font:500 .95rem/1.5 system-ui,sans-serif";
    d.textContent = "Moonlight site: " + msg;
    document.body.append(d);
  }

  const gameBy = (slug) => DATA_GAMES.find((g) => g.slug === slug);
  const tagLabel = (k) => (k === "general" ? "General" : gameBy(k) ? gameBy(k).title : k);
  const tagHue = (k) => (gameBy(k) ? gameBy(k).hue : 235);
  const statusPhase = (key) => (key === "released" ? 1 : key === "progress" ? 0.5 : 0.18);
  const tagPhase = (k) => (gameBy(k) ? statusPhase(gameBy(k).statusKey) : 0.22);
  const logs = DATA_DEVLOGS.slice().sort((a, b) => b.date.localeCompare(a.date));

  /* ---------- moon phase drawing ---------- */
  // k = how much of the moon is lit, 0 (new) to 1 (full). Waxing: lit on the right.
  function phasePath(cx, cy, r, k) {
    const rx = Math.abs(1 - 2 * k) * r;
    const sweep = k < 0.5 ? 0 : 1;
    return `M${cx} ${cy - r}A${r} ${r} 0 0 1 ${cx} ${cy + r}A${rx.toFixed(2)} ${r} 0 0 ${sweep} ${cx} ${cy - r}Z`;
  }
  function phaseIcon(k, size = 18) {
    return `<svg class="phase" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#232b6e" stroke="rgba(170,186,255,.35)" stroke-width="1"/><path d="${phasePath(10, 10, 9, k)}" fill="#f1ebd5"/></svg>`;
  }
  const LOGO_FILE = "images/header logo.png"; // your logo: used in the header and footer. Delete the file and the little moon comes back.
  function logoMark(size = 30) {
    const moonSvg = `<svg class="logo-fallback" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="#232b6e"/><path d="${phasePath(10, 10, 9, 0.3)}" fill="#f1ebd5"/></svg>`;
    return `<img class="logo-img" src="${esc(asset(LOGO_FILE))}" width="${size}" height="${size}" alt="" style="width:auto;height:${size}px;max-width:${size * 3}px;object-fit:contain" data-fallback="${esc(moonSvg)}">`;
  }
  function logoFallbacks() {
    $$("img.logo-img").forEach((img) => {
      const swap = () => { const t = document.createElement("template"); t.innerHTML = img.dataset.fallback; img.replaceWith(t.content.firstChild); };
      if (img.complete && img.naturalWidth === 0) swap(); else img.addEventListener("error", swap, { once: true });
    });
  }

  /* ---------- shared bits ---------- */
  function art(src, label, hue, cls) {
    return `<div class="art ${cls || ""}" style="--h:${hue}"><span class="art-label">${esc(label)}</span>${src ? `<img src="${esc(asset(src))}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : ""}</div>`;
  }
  function statusBadge(g) {
    return `<span class="status">${phaseIcon(statusPhase(g.statusKey))}${esc(g.status)}</span>`;
  }
  function posterCard(g) {
    return `<a class="poster" style="--h:${g.hue}" href="${gameUrl(g.slug)}">
      ${art(g.cover, g.title, g.hue)}
      <div class="poster-body">
        ${statusBadge(g)}
        <h3>${esc(g.title)}</h3>
        ${g.subtitle ? `<span class="poster-sub">${esc(g.subtitle)}</span>` : ""}
        <p>${esc(g.short)}</p>
      </div></a>`;
  }
  function logRow(l) {
    return `<a class="log-row" style="--h:${tagHue(l.game)}" href="${logUrl(l.slug)}">
      <time datetime="${esc(l.date)}">${fmtDate(l.date)}</time>
      ${art(l.cover, l.title, tagHue(l.game), "log-thumb")}
      <div class="log-text"><h3>${esc(l.title)}</h3><p>${esc(l.excerpt)}</p></div>
      <div class="log-meta"><time datetime="${esc(l.date)}">${fmtDate(l.date)}</time><span class="tag">${phaseIcon(tagPhase(l.game), 14)}${esc(tagLabel(l.game))}</span></div>
    </a>`;
  }
  function inline(text) {
    return esc(text)
      .replace(/`(.+?)`/g, "<code>$1</code>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|[\w\-./#?=&%]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function videoEmbed(id, title) {
    if (!id) return `<div class="video art" style="--h:235"><span class="art-label">${esc(title || "Video")}</span></div>`;
    return `<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" title="${esc(title || "Video")}" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;
  }

  /* ---------- skyline (footer ground) ---------- */
  function skyline() {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const tiers = [[0, 0.52, 0.55], [0.22, 0.78, 0.8], [0.45, 1, 1]];
    const pine = (x, y, h, w) => tiers.map(([t, b, k]) => {
      const y1 = y - h + t * h, y2 = y - h + b * h, hw = (w / 2) * k;
      return `M${x.toFixed(1)} ${y1.toFixed(1)}L${(x + hw).toFixed(1)} ${y2.toFixed(1)}L${(x - hw).toFixed(1)} ${y2.toFixed(1)}Z`;
    }).join("");
    let far = "", near = "";
    for (let x = -10; x < 1450; x += 30 + rnd() * 70) far += pine(x, 108, 34 + rnd() * 30, 14 + rnd() * 10);
    for (let x = -10; x < 1450; x += 20 + rnd() * 60) {
      if (x > 775 && x < 900) continue; // clearing for the cabin
      near += pine(x, 128, 40 + rnd() * 52, 15 + rnd() * 12);
    }
    return `<svg class="skyline" viewBox="0 0 1440 140" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs><radialGradient id="cab-glow"><stop offset="0" stop-color="#ffb56b" stop-opacity=".5"/><stop offset="1" stop-color="#ffb56b" stop-opacity="0"/></radialGradient></defs>
      <path fill="#0d1238" d="M0 140V70C250 40 450 80 700 60S1100 30 1440 65V140Z"/>
      <path fill="#0d1238" d="${far}"/>
      <path fill="#070a22" d="M0 140V95C200 70 380 100 560 88S900 60 1100 85S1340 100 1440 80V140Z"/>
      <path fill="#070a22" d="${near}"/>
      <g transform="translate(-150 0)"><circle cx="988" cy="72" r="30" fill="url(#cab-glow)"/>
      <path fill="#070a22" d="M960 90V62H1016V90ZM954 62L988 44L1022 62ZM1002 52V40H1008V54Z"/>
      <rect x="970" y="68" width="9" height="9" fill="#ffb56b"/><rect x="996" y="68" width="9" height="9" fill="#ffb56b" opacity=".85"/></g>
    </svg>`;
  }

  /* ---------- per-game colour wash ---------- */
  function setWash(hue) {
    document.documentElement.style.setProperty("--gh", hue);
    const w = document.createElement("div");
    w.className = "wash"; w.setAttribute("aria-hidden", "true");
    const m = $(".moon-wrap");
    if (m) m.before(w); else document.body.prepend(w);
  }

  /* ---------- moonlight that follows the cursor over cards ---------- */
  function glow() {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const sel = ".poster,.log-row,.tab,.band,.form,.game-cta,.person";
    document.addEventListener("pointermove", (e) => {
      const t = e.target.closest && e.target.closest(sel);
      if (!t) return;
      const r = t.getBoundingClientRect();
      t.style.setProperty("--mx", e.clientX - r.left + "px");
      t.style.setProperty("--my", e.clientY - r.top + "px");
    }, { passive: true });
  }

  /* ---------- header + footer ---------- */
  function chrome() {
    const page = document.body.dataset.page;
    const active = page === "game" ? "games" : page === "devlog" ? "devlogs" : page;
    const nav = [["home", "", "Home"], ["games", "games/", "Games"], ["devlogs", "devlogs/", "Devlogs"], ["about", "about/", "About"], ["contact", "contact/", "Contact"]];
    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = `<div class="container header-inner">
      <a class="brand" href="${href("")}">${logoMark(60)}<span>Moonlight Studios</span></a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Menu"><span></span></button>
      <nav class="site-nav" id="site-nav" aria-label="Main"><ul>${nav.map((n) => `<li><a href="${href(n[1])}"${n[0] === active ? ' aria-current="page"' : ""}>${n[2]}</a></li>`).join("")}</ul></nav>
    </div>`;
    const skip = document.createElement("a");
    skip.className = "skip"; skip.href = "#app"; skip.textContent = "Skip to content";
    document.body.prepend(header);
    document.body.prepend(skip);

    const toggle = $(".nav-toggle", header), menu = $("#site-nav", header);
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });
    const closeMenu = () => { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); };
    $$("a", menu).forEach((a) => a.addEventListener("click", closeMenu));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("open")) { closeMenu(); toggle.focus(); } });
    document.addEventListener("click", (e) => { if (menu.classList.contains("open") && !header.contains(e.target)) closeMenu(); });

    const s = DATA_SITE.socials;
    const connect = [
      s.itch && `<li><a href="${esc(s.itch)}" target="_blank" rel="noopener">itch.io</a></li>`,
      s.youtube && `<li><a href="${esc(s.youtube)}" target="_blank" rel="noopener">YouTube</a></li>`,
      s.discord && `<li><a href="${esc(s.discord)}" target="_blank" rel="noopener">Discord</a></li>`,
      s.x && `<li><a href="${esc(s.x)}" target="_blank" rel="noopener">X</a></li>`,
      `<li><a href="${href("contact/")}">Email us</a></li>`
    ].filter(Boolean).join("");
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = skyline() + `<div class="container">
      <div class="foot-grid">
        <div class="foot-brand"><a class="brand" href="${href("")}">${logoMark(30)}<span>Moonlight Studios</span></a><p>An independent game studio making worlds worth staying up for.</p></div>
        <div><h4>Explore</h4><ul>${nav.map((n) => `<li><a href="${href(n[1])}">${n[2]}</a></li>`).join("")}</ul></div>
        <div><h4>Games</h4><ul>${DATA_GAMES.map((g) => `<li><a href="${gameUrl(g.slug)}">${esc(g.title)}</a></li>`).join("")}</ul></div>
        <div><h4>Find us</h4><ul>${connect}</ul></div>
      </div>
      <div class="foot-bottom"><span>© ${new Date().getFullYear()} Moonlight Studios. All rights reserved.</span>
        <nav aria-label="Legal"><a href="${href("privacy_policy.html")}">Privacy policy</a><a href="${href("terms_of_service.html")}">Terms of service</a></nav></div>
    </div>`;
    document.body.append(footer);
    logoFallbacks();
  }

  /* ---------- background: stars + waxing moon ---------- */
  function stars() {
    const c = document.createElement("canvas");
    c.id = "stars"; c.setAttribute("aria-hidden", "true");
    document.body.prepend(c);
    const x = c.getContext("2d");
    let w, h, S = [], shoots = [], next = performance.now() + 2200, running = true;
    function size() {
      w = c.width = innerWidth; h = c.height = innerHeight;
      const n = Math.min(w < 700 ? 110 : 240, Math.floor((w * h) / 8500));
      S = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.25, p: Math.random() * 6.28, s: Math.random() * 0.02 + 0.006 }));
    }
    function spawn(t) {
      const count = Math.random() < 0.25 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const ang = ((16 + Math.random() * 24) * Math.PI) / 180, dir = Math.random() < 0.55 ? -1 : 1, speed = 9 + Math.random() * 6;
        shoots.push({ x: w * (0.1 + Math.random() * 0.85), y: Math.random() * h * 0.5, vx: dir * Math.cos(ang) * speed, vy: Math.sin(ang) * speed, life: 0, max: 60 + Math.random() * 35, len: 130 + Math.random() * 110 });
      }
      next = t + 4500 + Math.random() * 6500;
    }
    function draw(t) {
      x.clearRect(0, 0, w, h);
      x.fillStyle = "#dfe6ff";
      for (const s of S) {
        x.globalAlpha = reduceMotion ? 0.6 : 0.3 + 0.7 * Math.abs(Math.sin(s.p + t * s.s * 0.1));
        x.beginPath(); x.arc(s.x, s.y, s.r, 0, 6.283); x.fill();
      }
      if (reduceMotion) return;
      if (t >= next) spawn(t);
      shoots = shoots.filter((o) => o.life < o.max && o.x > -300 && o.x < w + 300 && o.y < h + 100);
      for (const o of shoots) {
        const a = Math.sin((Math.PI * o.life) / o.max);
        const sp = Math.hypot(o.vx, o.vy), tx = o.x - (o.vx / sp) * o.len, ty = o.y - (o.vy / sp) * o.len;
        const g = x.createLinearGradient(o.x, o.y, tx, ty);
        g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.35, `rgba(190,205,255,${a * 0.45})`); g.addColorStop(1, "rgba(160,180,255,0)");
        x.globalAlpha = 1; x.strokeStyle = g; x.lineWidth = 2; x.lineCap = "round";
        x.beginPath(); x.moveTo(o.x, o.y); x.lineTo(tx, ty); x.stroke();
        x.fillStyle = `rgba(255,255,255,${a})`; x.beginPath(); x.arc(o.x, o.y, 2.1, 0, 6.283); x.fill();
        o.x += o.vx; o.y += o.vy; o.life++;
      }
    }
    function frame(t) {
      draw(t);
      if (running && !reduceMotion) requestAnimationFrame(frame);
    }
    size();
    addEventListener("resize", () => { size(); if (reduceMotion) draw(0); });
    document.addEventListener("visibilitychange", () => {
      running = !document.hidden;
      if (running && !reduceMotion) requestAnimationFrame(frame);
    });
    requestAnimationFrame(frame);
  }

  function clouds() {
    const m = $(".moon-wrap");
    if (!m) return;
    const box = document.createElement("div");
    box.className = "clouds"; box.setAttribute("aria-hidden", "true");
    box.innerHTML = '<i class="cloud c1"></i><i class="cloud c2"></i><i class="cloud c3"></i><i class="cloud c4"></i>';
    m.after(box);
  }

  /* ---------- the moon: a full moon that turns on its axis, with rippling moonlight; drifts up as you scroll ---------- */
  const MOON_PHASE = 1;    // how much of it is lit: 1 = full moon, 0.5 = half, 0.3 = crescent
  const MOON_DRIFT = 14;   // how far it floats upward as you scroll, in % of the screen height
  const MOON_SPIN_SECONDS = 100; // time for one full turn on its axis (0 would freeze it, so use a big number to slow it)
  const MOON_TILT = 12;    // lean of its axis, in degrees
  function moon() {
    const wrap = document.createElement("div");
    wrap.className = "moon-wrap"; wrap.setAttribute("aria-hidden", "true");
    const lit = Math.min(0.999, Math.max(0.001, MOON_PHASE));
    const clipD = MOON_PHASE >= 0.999 ? "M250 80A170 170 0 1 1 250 420A170 170 0 1 1 250 80Z" : phasePath(250, 250, 170, lit);
    wrap.innerHTML = `<svg viewBox="0 0 500 500">
      <defs>
        <radialGradient id="m-halo"><stop offset="0.3" stop-color="#9fb2ff" stop-opacity=".34"/><stop offset="1" stop-color="#9fb2ff" stop-opacity="0"/></radialGradient>
        <radialGradient id="m-face" cx="38%" cy="34%"><stop offset="0" stop-color="#fffdf1"/><stop offset=".6" stop-color="#ece5c5"/><stop offset="1" stop-color="#bdb690"/></radialGradient>
        <radialGradient id="m-limb" cx="50%" cy="50%" r="50%"><stop offset=".7" stop-color="#3a3524" stop-opacity="0"/><stop offset="1" stop-color="#3a3524" stop-opacity=".45"/></radialGradient>
        <clipPath id="m-clip"><path d="${clipD}"/></clipPath>
      </defs>
      <circle id="m-glow" cx="250" cy="250" r="250" fill="url(#m-halo)"/>
      <circle class="m-ripple" cx="250" cy="250" r="170" fill="none" stroke="#b7c5ff" stroke-width="2"/>
      <circle class="m-ripple r2" cx="250" cy="250" r="170" fill="none" stroke="#b7c5ff" stroke-width="2"/>
      <circle cx="250" cy="250" r="170" fill="#151b4c"/>
      <g clip-path="url(#m-clip)">
        <circle cx="250" cy="250" r="170" fill="url(#m-face)"/>
        <g id="m-surface"></g>
        <circle cx="250" cy="250" r="170" fill="url(#m-limb)"/>
      </g>
    </svg>`;
    document.body.prepend(wrap);
    const isHome = document.body.dataset.page === "home";
    let shown = 0, target = 0, raf = 0;

    function apply() {
      wrap.style.setProperty("--ty", (-shown * MOON_DRIFT).toFixed(2) + "vh");
    }
    function readScroll() {
      const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      target = Math.min(1, Math.max(0, scrollY / max));
      const fade = isHome ? Math.max(0.35, 1 - scrollY / (innerHeight * 1.1)) : 1;
      wrap.style.setProperty("--mo", fade.toFixed(3));
      if (reduceMotion) { shown = target; apply(); } else kick();
    }
    function kick() { if (!raf) raf = requestAnimationFrame(step); }
    function step() {
      raf = 0;
      shown += (target - shown) * 0.07;
      apply();
      if (Math.abs(target - shown) > 0.0005) kick();
    }
    /* the surface: dark plains and craters sit on a sphere that turns about a slightly tilted axis */
    const NS = "http://www.w3.org/2000/svg";
    const surface = $("#m-surface", wrap);
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const feats = [];
    const addFeats = (n, minA, maxA, alpha) => {
      for (let i = 0; i < n; i++) {
        const el = document.createElementNS(NS, "ellipse");
        el.setAttribute("fill", "#8d865f");
        surface.appendChild(el);
        feats.push({ el, lon: rnd() * 6.2832, lat: Math.asin(rnd() * 2 - 1), a: minA + rnd() * (maxA - minA), alpha });
      }
    };
    addFeats(7, 0.38, 0.62, 0.12);  // large dark plains
    addFeats(30, 0.05, 0.17, 0.2);  // craters
    const TILT = (MOON_TILT * Math.PI) / 180, R = 170;
    function spin(theta) {
      const ct = Math.cos(TILT), st = Math.sin(TILT);
      for (const f of feats) {
        const lam = f.lon + theta, cl = Math.cos(f.lat);
        const z = cl * Math.cos(lam);
        if (z < 0.03) { f.el.setAttribute("fill-opacity", "0"); continue; }
        const x = R * cl * Math.sin(lam), y = -R * Math.sin(f.lat);
        const tx = x * ct - y * st, ty = x * st + y * ct;
        const rc = R * Math.sin(f.a);
        f.el.setAttribute("transform", `translate(${(250 + tx).toFixed(1)} ${(250 + ty).toFixed(1)}) rotate(${((Math.atan2(ty, tx) * 180) / Math.PI).toFixed(1)})`);
        f.el.setAttribute("rx", (rc * z).toFixed(2));
        f.el.setAttribute("ry", rc.toFixed(2));
        f.el.setAttribute("fill-opacity", (f.alpha * Math.min(1, z * 2.4)).toFixed(3));
      }
    }
    let theta = 0.5, last = 0, spinning = false;
    function tick(t) {
      if (!spinning) return;
      if (last) theta += ((t - last) / 1000) * ((Math.PI * 2) / MOON_SPIN_SECONDS);
      last = t;
      spin(theta);
      requestAnimationFrame(tick);
    }
    spin(theta);
    if (!reduceMotion) { spinning = true; requestAnimationFrame(tick); }
    document.addEventListener("visibilitychange", () => {
      if (reduceMotion) return;
      if (document.hidden) { spinning = false; last = 0; } else if (!spinning) { spinning = true; requestAnimationFrame(tick); }
    });

    addEventListener("scroll", readScroll, { passive: true });
    addEventListener("resize", readScroll);
    readScroll();
    apply();
  }

  /* ---------- home ---------- */
  function showcase() {
    const el = $("#showcase");
    if (!el) return;
    el.innerHTML = `<div class="stage">${DATA_GAMES.map((g, i) => `
        <article class="slide${i ? "" : " on"}" aria-hidden="${i ? "true" : "false"}">
          ${art(g.showcase || g.hero || g.cover, g.title, g.hue)}
          <div class="slide-shade"></div>
          <div class="slide-copy">
            ${statusBadge(g)}
            <h3>${esc(g.title)}</h3>
            <p>${esc(g.tagline)}</p>
            <div class="btn-row">
              <a class="btn btn-moon" href="${gameUrl(g.slug)}">View game</a>
              ${g.itch ? `<a class="btn btn-lamp" href="${esc(g.itch)}" target="_blank" rel="noopener">Play on itch.io</a>` : ""}
            </div>
          </div>
        </article>`).join("")}</div>
      <div class="showcase-tabs" role="tablist" aria-label="Featured games">${DATA_GAMES.map((g, i) => `
        <button class="tab${i ? "" : " on"}" role="tab" aria-selected="${i ? "false" : "true"}" data-i="${i}">
          ${phaseIcon(statusPhase(g.statusKey), 26)}<span><strong>${esc(g.title)}</strong><small>${esc(g.status)}</small></span>
        </button>`).join("")}</div>`;
    const slides = $$(".slide", el), tabs = $$(".tab", el);
    let i = 0, timer;
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => { s.classList.toggle("on", k === i); s.setAttribute("aria-hidden", k === i ? "false" : "true"); });
      tabs.forEach((t, k) => { t.classList.toggle("on", k === i); t.setAttribute("aria-selected", k === i ? "true" : "false"); t.tabIndex = k === i ? 0 : -1; });
    }
    function auto() { clearInterval(timer); if (!reduceMotion) timer = setInterval(() => go(i + 1), 8000); }
    tabs.forEach((t) => t.addEventListener("click", () => { go(+t.dataset.i); auto(); }));
    el.addEventListener("mouseenter", () => clearInterval(timer));
    el.addEventListener("mouseleave", auto);
    el.addEventListener("focusin", () => clearInterval(timer));
    el.addEventListener("keydown", (e) => {
      const k = e.key;
      if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(k) || !e.target.closest(".tab")) return;
      e.preventDefault();
      go(i + (k === "ArrowRight" || k === "ArrowDown" ? 1 : -1));
      tabs[i].focus();
    });
    let sx = null;
    const stage = $(".stage", el);
    stage.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", (e) => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) { go(i + (dx < 0 ? 1 : -1)); auto(); }
    }, { passive: true });
    go(0);
    auto();
  }

  function homeLists() {
    const g = $("#home-games");
    if (g) g.innerHTML = DATA_GAMES.map(posterCard).join("");
    const d = $("#home-devlogs");
    if (d) d.innerHTML = logs.slice(0, 3).map(logRow).join("");
  }

  /* ---------- games index ---------- */
  function gamesPage() {
    const grid = $("#games-grid"), chips = $("#games-filters");
    if (!grid) return;
    const opts = [["all", "All games", null]];
    [["released", "Released"], ["progress", "In progress"], ["upcoming", "Upcoming"]].forEach((s) => {
      if (DATA_GAMES.some((g) => g.statusKey === s[0])) opts.push([s[0], s[1], statusPhase(s[0])]);
    });
    let f = "all";
    function draw() {
      chips.innerHTML = opts.map((o) => `<button class="chip${o[0] === f ? " on" : ""}" data-f="${o[0]}">${o[2] != null ? phaseIcon(o[2], 14) : ""}${o[1]}</button>`).join("");
      const list = DATA_GAMES.filter((g) => f === "all" || g.statusKey === f);
      grid.innerHTML = list.map(posterCard).join("");
    }
    chips.addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { f = b.dataset.f; draw(); } });
    if (opts.length < 3) chips.style.display = "none";
    draw();
  }

  /* ---------- single game ---------- */
  function gamePage() {
    const el = $("#game");
    if (!el) return;
    const g = gameBy(params.get("g"));
    if (!g) {
      document.title = "Game not found | Moonlight Studios";
      el.innerHTML = `<div class="container notfound"><h1>Game not found</h1><p>That link doesn't match a game. Pick one from the <a href="${href("games/")}">games page</a>.</p></div>`;
      return;
    }
    document.title = `${g.title} | Moonlight Studios`;
    setWash(g.hue);
    const meta = $('meta[name="description"]'); if (meta) meta.content = g.tagline;
    const gl = logs.filter((l) => l.game === g.slug);
    const facts = (g.facts || []).slice();
    facts.push(["Devlogs", gl.length ? `${gl.length} ${gl.length === 1 ? "post" : "posts"}` : "None yet"]);
    const others = DATA_GAMES.filter((x) => x.slug !== g.slug);
    const logoHtml = g.logo
      ? `<img class="g-logo" src="${esc(asset(g.logo))}" alt="${esc(g.title)}" onerror="this.replaceWith(document.createTextNode(this.alt))">`
      : esc(g.title);

    el.innerHTML = `
      <header class="g-hero" style="--h:${g.hue}">
        ${art(g.hero || g.cover, g.title, g.hue)}
        <div class="g-hero-shade"></div>
        <div class="container g-hero-copy">
          ${statusBadge(g)}
          <h1>${logoHtml}</h1>
          ${g.subtitle ? `<p class="g-sub">${esc(g.subtitle)}</p>` : ""}
          <p class="g-tagline">${esc(g.tagline)}</p>
          <div class="btn-row">
            ${g.itch ? `<a class="btn btn-lamp" href="${esc(g.itch)}" target="_blank" rel="noopener">Play on itch.io</a>` : ""}
            ${gl.length ? `<a class="btn btn-line" href="#devlogs">Read the devlogs</a>` : ""}
          </div>
        </div>
      </header>

      <section class="section container">
        <div class="g-body">
          <div class="prose">
            <h2>About the game</h2>
            ${g.description.map((p) => `<p>${esc(p)}</p>`).join("")}
            ${g.features && g.features.length ? `<ul class="feature-list">${g.features.map((f) => `<li>${phaseIcon(1, 16)}${esc(f)}</li>`).join("")}</ul>` : ""}
          </div>
          <aside class="facts" aria-label="Game details">
            <dl>${facts.map((f) => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join("")}</dl>
            ${g.itch ? `<a class="btn btn-lamp" href="${esc(g.itch)}" target="_blank" rel="noopener">Play on itch.io</a>` : `<p class="no-link">The itch.io page is coming soon.</p>`}
          </aside>
        </div>
      </section>

      ${g.videos && g.videos.length ? `<section class="section-tight container"><div class="section-head"><h2>Videos</h2></div>
        <div class="videos">${g.videos.map((v) => `<div>${videoEmbed(v.id, v.title)}${v.title ? `<p class="video-title">${esc(v.title)}</p>` : ""}</div>`).join("")}</div></section>` : ""}

      ${g.screenshots && g.screenshots.length ? `<section class="section-tight container"><div class="section-head"><h2>Screenshots</h2></div>
        <div class="gallery">${g.screenshots.map((s, i) => `<button data-i="${i}" aria-label="Open screenshot ${i + 1}">${art(s, "Screenshot " + (i + 1), g.hue)}</button>`).join("")}</div></section>` : ""}

      <section class="section container" id="devlogs">
        <div class="section-head"><div><h2>${esc(g.title)} devlogs</h2><p>${gl.length ? "Follow along with how it's made." : "No devlogs for this game yet."}</p></div>
          ${gl.length ? `<a class="text-link" href="${logsUrl(g.slug)}">See all devlogs for this game</a>` : ""}</div>
        ${gl.length ? `<div class="log-list">${gl.map(logRow).join("")}</div>` : ""}
      </section>

      ${others.length ? `<section class="section-tight container"><div class="section-head"><h2>More from Moonlight</h2></div><div class="game-grid">${others.map(posterCard).join("")}</div></section>` : ""}
    `;

    // lightbox for screenshots
    const shots = g.screenshots || [];
    if (!shots.length) return;
    const lb = document.createElement("div");
    lb.className = "lightbox"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Screenshot viewer");
    lb.innerHTML = `<button class="lb-close" aria-label="Close">✕</button><button class="lb-prev" aria-label="Previous">‹</button><div class="lb-stage"></div><button class="lb-next" aria-label="Next">›</button>`;
    document.body.append(lb);
    const stage = $(".lb-stage", lb);
    let idx = 0;
    function show(n) {
      idx = (n + shots.length) % shots.length;
      stage.innerHTML = `<img src="${esc(asset(shots[idx]))}" alt="${esc(g.title)} screenshot ${idx + 1}">`;
      $("img", stage).onerror = function () { stage.innerHTML = `<p class="lb-msg">This screenshot hasn't been added yet. Put the image at <code>${esc(shots[idx])}</code> and it will appear here.</p>`; };
    }
    const open = (n) => { show(n); lb.classList.add("open"); $(".lb-close", lb).focus(); };
    const close = () => lb.classList.remove("open");
    $$(".gallery button", el).forEach((b) => b.addEventListener("click", () => open(+b.dataset.i)));
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", () => show(idx - 1));
    $(".lb-next", lb).addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    let lx = null;
    lb.addEventListener("touchstart", (e) => { lx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (lx == null) return;
      const dx = e.changedTouches[0].clientX - lx; lx = null;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
    addEventListener("keydown", (e) => {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ---------- devlogs index ---------- */
  function devlogsPage() {
    const list = $("#log-list"), chips = $("#log-filters"), search = $("#log-search"), count = $("#log-count");
    if (!list) return;
    const keys = ["all", "general"].concat(DATA_GAMES.map((g) => g.slug));
    let f = keys.includes(params.get("filter")) ? params.get("filter") : "all";
    let q = "";
    const countFor = (k) => (k === "all" ? logs.length : logs.filter((l) => l.game === k).length);

    function draw() {
      chips.innerHTML = keys.map((k) => `<button class="chip${k === f ? " on" : ""}" data-f="${k}" aria-pressed="${k === f}">
        ${k === "all" ? "" : phaseIcon(tagPhase(k), 14)}${k === "all" ? "All" : esc(tagLabel(k))} <span class="count">${countFor(k)}</span></button>`).join("");
      const needle = q.trim().toLowerCase();
      const out = logs.filter((l) => (f === "all" || l.game === f) && (!needle || (l.title + " " + l.excerpt).toLowerCase().includes(needle)));
      count.textContent = `${out.length} ${out.length === 1 ? "post" : "posts"}`;
      list.innerHTML = out.length
        ? out.map(logRow).join("")
        : `<div class="empty"><h3>Nothing here yet</h3><p>${needle ? "No devlogs match that search. Try a different word, or clear the search." : "There are no devlogs in this category yet."}</p></div>`;
    }
    chips.addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      f = b.dataset.f; draw();
      const u = new URL(location.href); f === "all" ? u.searchParams.delete("filter") : u.searchParams.set("filter", f);
      history.replaceState(null, "", u);
    });
    search.addEventListener("input", () => { q = search.value; draw(); });
    draw();
  }

  /* ---------- single devlog ---------- */
  function renderBlock(b, hue) {
    switch (b.type) {
      case "h": return `<h2>${esc(b.text)}</h2>`;
      case "p": return `<p>${inline(b.text)}</p>`;
      case "quote": return `<blockquote>${inline(b.text)}</blockquote>`;
      case "list": return `<ul>${(b.items || []).map((i) => `<li><span>${inline(i)}</span></li>`).join("")}</ul>`;
      case "img": return `<figure>${art(b.src, b.caption || "Image", hue)}${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}</figure>`;
      case "gallery": return `<div class="gal">${(b.images || []).map((s, i) => art(s, "Image " + (i + 1), hue)).join("")}</div>`;
      case "video": return videoEmbed(b.id, b.title);
      default: return "";
    }
  }
  function devlogPage() {
    const el = $("#devlog");
    if (!el) return;
    const l = logs.find((x) => x.slug === params.get("p"));
    if (!l) {
      document.title = "Devlog not found | Moonlight Studios";
      el.innerHTML = `<div class="container notfound"><h1>Devlog not found</h1><p>That link doesn't match a post. Browse all posts on the <a href="${href("devlogs/")}">devlogs page</a>.</p></div>`;
      return;
    }
    document.title = `${l.title} | Moonlight Studios`;
    const meta = $('meta[name="description"]'); if (meta) meta.content = l.excerpt;
    const hue = tagHue(l.game), g = gameBy(l.game);
    if (g) setWash(hue);
    const words = l.body.map((b) => (b.text || (b.items || []).join(" ") || "")).join(" ").split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.round(words / 200));
    const same = logs.filter((x) => x.game === l.game);
    const at = same.findIndex((x) => x.slug === l.slug);
    const newer = same[at - 1], older = same[at + 1];

    el.innerHTML = `
      <div class="container">
        <header class="article-head article">
          <a class="crumb" href="${logsUrl(l.game)}">Back to ${esc(tagLabel(l.game))} devlogs</a>
          <h1>${esc(l.title)}</h1>
          <div class="article-meta"><span class="tag">${phaseIcon(tagPhase(l.game), 14)}${esc(tagLabel(l.game))}</span><time datetime="${esc(l.date)}">${fmtDate(l.date)}</time><span>${mins} min read</span></div>
        </header>
        ${l.cover ? `<div class="article-cover">${art(l.cover, l.title, hue)}</div>` : ""}
        <article class="article">${l.body.map((b) => renderBlock(b, hue)).join("")}</article>
        <div class="article-foot">
          ${g ? `<div class="game-cta"><div><h3>${esc(g.title)}</h3><p style="color:var(--dim)">${esc(g.short)}</p></div>
            <div class="btn-row"><a class="btn btn-moon" href="${gameUrl(g.slug)}">Game page</a>${g.itch ? `<a class="btn btn-lamp" href="${esc(g.itch)}" target="_blank" rel="noopener">Play on itch.io</a>` : ""}</div></div>` : ""}
          <nav class="pn" aria-label="More devlogs">
            ${older ? `<a class="prev" href="${logUrl(older.slug)}"><small>Older post</small><strong>${esc(older.title)}</strong></a>` : "<span></span>"}
            ${newer ? `<a class="next" href="${logUrl(newer.slug)}"><small>Newer post</small><strong>${esc(newer.title)}</strong></a>` : "<span></span>"}
          </nav>
        </div>
      </div>`;
  }

  /* ---------- about ---------- */
  function aboutPage() {
    const el = $("#about-stats");
    if (!el) return;
    const released = DATA_GAMES.filter((g) => g.statusKey === "released").length;
    el.innerHTML = `<div><strong>${DATA_GAMES.length}</strong><span>games made</span></div><div><strong>${released}</strong><span>released</span></div><div><strong>${logs.length}</strong><span>devlogs written</span></div>`;
    const gl = $("#about-games");
    if (gl) gl.innerHTML = DATA_GAMES.map(posterCard).join("");
  }

  /* ---------- contact ---------- */
  function contactPage() {
    const form = $("#contact-form");
    if (!form) return;
    const social = $("#contact-social");
    if (social) {
      const s = DATA_SITE.socials;
      const items = [DATA_SITE.email && ["Email", "mailto:" + DATA_SITE.email], ["itch.io", s.itch], ["YouTube", s.youtube], ["Discord", s.discord], ["X", s.x]].filter((x) => x && x[1]);
      social.innerHTML = items.length
        ? `<h3 style="font-size:1.2rem;margin-bottom:.4rem">Find us elsewhere</h3>` + items.map((x) => `<a href="${esc(x[1])}"${x[1].startsWith("mailto:") ? "" : ' target="_blank" rel="noopener"'}>${phaseIcon(1, 18)}<span>${esc(x[0])}</span></a>`).join("")
        : "";
    }
    const msg = $(".form-msg", form), btn = $("button[type=submit]", form);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if ($("[name=_gotcha]", form).value) return; // honeypot
      msg.className = "form-msg"; msg.textContent = "Sending...";
      btn.disabled = true;
      const payload = {
        name: $("[name=name]", form).value,
        email: $("[name=email]", form).value,
        topic: $("[name=topic]", form).value,
        message: $("[name=message]", form).value,
        _replyto_studio: DATA_SITE.replyTo
      };
      try {
        if (!DATA_SITE.formEndpoint) throw new Error("no endpoint");
        const r = await fetch(DATA_SITE.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error("Server response failed");
        form.reset();
        msg.className = "form-msg ok"; msg.textContent = "Message sent successfully!";
      } catch (err) {
        msg.className = "form-msg err"; msg.textContent = "Error sending message. Try again later.";
      }
      btn.disabled = false;
    });
  }

  /* ---------- opened from disk (file://): folder links need index.html ---------- */
  function fixLocalLinks() {
    if (CLEAN) return;
    $$("a[href]").forEach((a) => {
      const h = a.getAttribute("href");
      if (/^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(h)) return;
      const m = h.match(/^([^?#]*\/)([?#].*)?$/);
      if (m) a.setAttribute("href", m[1] + "index.html" + (m[2] || ""));
    });
  }

  /* ---------- go ---------- */
  [chrome, stars, moon, clouds, glow, showcase, homeLists, gamesPage, gamePage, devlogsPage, devlogPage, aboutPage, contactPage, fixLocalLinks, alertData].forEach((step) => {
    try { step(); } catch (err) { console.error("Moonlight site: " + step.name + " failed", err); }
  });
})();