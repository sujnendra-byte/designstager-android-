/* DesignStager Android app: injected into designstager.com pages (at document start when supported).
   - opens the app's own Home instead of the website home page (e.g. after login / logout)
   - app header (back, page title, credits) + bottom tab bar, clean light look
   - compact AI Presentation mode buttons, compact marketplace categories that hide on scroll
   - saves in-browser downloads (blob/data links) to the phone */
(function () {
  if (window.__dsApp) return;
  window.__dsApp = true;
  var HOME = 'https://localhost/index.html';
  var CREATE = 'https://localhost/create.html';
  var path = location.pathname;

  /* ---------- website home page -> app home ---------- */
  if ((path === '/' || path === '') && !/[?&](s|p|page_id|add-to-cart)=/.test(location.search)) {
    location.replace(HOME);
    return;
  }

  /* ---------- always use the light theme in the app ---------- */
  try { localStorage.setItem('ds-theme', 'light'); } catch (e) { }
  var doc = document.documentElement;
  doc.classList.add('ds-app');
  doc.classList.remove('ds-dark', 'mode-dark');

  var TITLES = [
    [/^\/ai-presentation/, 'AI Presentation'], [/^\/ai-document/, 'AI Document'], [/^\/ai-charts/, 'AI Charts'],
    [/^\/ai-studio\/ai-audio/, 'AI Audio & Voice'], [/^\/ai-studio/, 'AI Images'], [/^\/ai-video/, 'AI Video'],
    [/^\/marketplace/, 'Marketplace'], [/^\/my-creations|^\/my-generated/, 'My Creations'], [/^\/my-account/, 'My Account'],
    [/^\/login/, 'Log in'], [/^\/register|^\/sign-?up/, 'Sign up'], [/^\/pricing/, 'Pricing'], [/^\/customize/, 'Custom design'],
    [/^\/contact/, 'Contact'], [/^\/blog/, 'Blog'], [/^\/terms/, 'Terms']
  ];
  var title = '';
  TITLES.forEach(function (t) { if (!title && t[0].test(path)) title = t[1]; });

  /* ---------- styles (added immediately so the website header never flashes) ---------- */
  var css = '' +
    /* hide website chrome */
    'html.ds-app #masthead, html.ds-app .site-header, html.ds-app .elementor-location-header,' +
    'html.ds-app .elementor-location-footer, html.ds-app footer.site-footer, html.ds-app #colophon,' +
    'html.ds-app .dst-bar, html.ds-app .dst-bar + div {display:none !important}' +
    /* Hostinger "Agent" (site-owner AI assistant) is not for app users */
    'html.ds-app [class*="kodee"], html.ds-app [id*="kodee"], html.ds-app [id*="hostinger-chatbot"],' +
    'html.ds-app [class*="hostinger-chatbot"], html.ds-app [class*="hts-chatbot"] {display:none !important}' +
    'html.ds-app body{padding-top:56px !important;padding-bottom:calc(68px + env(safe-area-inset-bottom,0px)) !important;background:#f4f5f9 !important}' +
    /* app header */
    '#ds-head{position:fixed;left:0;right:0;top:0;height:56px;z-index:99990;display:flex;align-items:center;gap:6px;' +
    'background:#141a30 !important;color:#fff !important;padding:0 14px 0 6px;font-family:Poppins,system-ui,sans-serif;box-sizing:border-box;border:0 !important}' +
    '#ds-head *{color:#fff !important}' +
    '#ds-head .b{width:40px;height:40px;display:grid;place-items:center;color:#fff;border:0;background:none !important;padding:0}' +
    '#ds-head .b svg{width:24px;height:24px}' +
    '#ds-head .t{flex:1;font-size:15px;font-weight:600;letter-spacing:.6px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#ds-head .cr{display:none;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,.12) !important;' +
    'color:#fff;text-decoration:none;font-size:13px;font-weight:500}' +
    '#ds-head .cr.on{display:flex}' +
    '#ds-head .cr svg{width:15px;height:15px;fill:#fff !important;stroke:none !important}' +
    /* bottom tabs */
    '#ds-tabs{position:fixed;left:0;right:0;bottom:0;z-index:99990;display:flex;background:#fff !important;' +
    'border-top:1px solid #e4e6ef;padding:6px 4px calc(env(safe-area-inset-bottom,0px) + 6px);' +
    'font-family:Poppins,system-ui,sans-serif;box-shadow:0 -4px 16px rgba(20,26,48,.06)}' +
    '#ds-tabs a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;' +
    'font-weight:500;color:#6b7190 !important;text-decoration:none;padding:4px 0;line-height:1.2}' +
    '#ds-tabs a.on{color:#e7552f !important}' +
    '#ds-head svg, #ds-tabs svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    '#ds-tabs svg{width:23px;height:23px}' +
    'html.ds-overlay #ds-head, html.ds-overlay #ds-tabs{display:none !important}' +
    'html.ds-overlay body{padding-top:0 !important;padding-bottom:0 !important}' +
    /* AI Presentation: compact mode buttons */
    'html.ds-app #dsqs .md{display:grid !important;grid-template-columns:repeat(4,1fr) !important;gap:6px !important;' +
    'padding:0 !important;margin:4px 0 14px !important;background:none !important;border:0 !important;box-shadow:none !important}' +
    'html.ds-app #dsqs .md button{min-height:0 !important;height:auto !important;padding:10px 4px !important;margin:0 !important;' +
    'border-radius:10px !important;font:700 10.5px/1.25 Poppins,system-ui,sans-serif !important;letter-spacing:.4px !important;' +
    'text-transform:uppercase !important;background:#fff !important;color:#141a30 !important;border:1px solid #d5d9e4 !important;' +
    'box-shadow:none !important;transform:none !important}' +
    'html.ds-app #dsqs .md button.on{background:#141a30 !important;color:#fff !important;border-color:#141a30 !important}' +
    'html.ds-app #dsqs .md button small, html.ds-app #dsqs .md button img.emoji{display:none !important}' +
    /* marketplace: compact category panel that hides while scrolling */
    '@media (max-width:900px){' +
    'html.ds-app .ds-mkt-sb{padding:10px 12px 8px !important;max-height:240px;overflow:hidden !important;' +
    'transition:max-height .28s ease,padding .28s ease,opacity .2s ease}' +
    'html.ds-app .ds-mkt-sb h3{display:none !important}' +
    'html.ds-app .ds-mkt-type-toggle{gap:8px !important;margin:0 0 8px !important}' +
    'html.ds-app .ds-mkt-type-btn{padding:8px 10px !important;font-size:14px !important;text-align:center;border-radius:10px !important}' +
    'html.ds-app .ds-mkt-mains{display:flex !important;flex-direction:row !important;align-items:center !important;' +
    'flex-wrap:nowrap !important;overflow-x:auto !important;gap:8px !important;padding-bottom:2px;scrollbar-width:none}' +
    'html.ds-app .ds-mkt-mains::-webkit-scrollbar{display:none}' +
    'html.ds-app .ds-mkt-main-btn{flex:0 0 auto !important;width:auto !important;max-width:none !important;min-width:0 !important;' +
    'white-space:nowrap !important;margin:0 !important;padding:7px 14px !important;font-size:12.5px !important;' +
    'border-radius:999px !important;letter-spacing:.3px}' +
    'html.ds-app.ds-sb-hide .ds-mkt-sb{max-height:0 !important;padding-top:0 !important;padding-bottom:0 !important;' +
    'opacity:0;border-bottom-width:0 !important}' +
    '}' +
    '#ds-toast{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);' +
    'z-index:99991;background:#141a30;color:#fff;font:500 13px Poppins,system-ui,sans-serif;' +
    'padding:10px 16px;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.25);display:none;max-width:86vw;text-align:center}';
  var st = document.createElement('style'); st.id = 'ds-app-style'; st.textContent = css;
  (document.head || doc).appendChild(st);

  /* ---------- header + tabs ---------- */
  var tabs = [
    ['Home', HOME, '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', /^$/],
    ['Create', CREATE, '<path d="M12 3l2.2 5.3L20 9l-4.5 3.8L17 19l-5-3-5 3 1.5-6.2L4 9l5.8-.7z"/>', /^\/(ai-|ai-studio)/],
    ['Market', 'https://designstager.com/marketplace/', '<path d="M4 7h16l-1.5 12a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z"/><path d="M9 7a3 3 0 0 1 6 0"/>', /^\/marketplace/],
    ['Creations', 'https://designstager.com/my-creations/', '<path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', /^\/(my-creations|my-generated)/],
    ['Account', 'https://designstager.com/my-account/', '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>', /^\/(my-account|login)/]
  ];
  function addUI() {
    if (document.getElementById('ds-tabs') || !document.body) return;
    if (!title) title = (document.title || 'DesignStager').replace(/\s*[-|–]\s*DesignStager.*$/i, '');
    var head = document.createElement('div'); head.id = 'ds-head';
    head.innerHTML = '<button class="b" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<div class="t"></div>' +
      '<a class="cr" href="https://designstager.com/pricing/"><svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z"/></svg><span></span></a>';
    head.querySelector('.t').textContent = title;
    head.querySelector('.b').onclick = function () {
      if (history.length > 1) history.back(); else location.href = CREATE;
    };
    document.body.appendChild(head);
    var nav = document.createElement('nav'); nav.id = 'ds-tabs';
    tabs.forEach(function (t) {
      var a = document.createElement('a'); a.href = t[1];
      if (t[3].test(path)) a.className = 'on';
      a.innerHTML = '<svg viewBox="0 0 24 24">' + t[2] + '</svg>' + t[0];
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
    var toast = document.createElement('div'); toast.id = 'ds-toast'; document.body.appendChild(toast);
    tidyModes();
    credits();
    setInterval(credits, 4000);
    setInterval(overlayCheck, 800);
  }
  function toast(msg) {
    var t = document.getElementById('ds-toast'); if (!t) return;
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = 'none'; }, 2600);
  }
  window.__dsToast = toast;

  /* credits: read the site's "607 cr" counter, show it in the header and remember it for the app screens */
  function credits() {
    var n = null, loggedIn = document.body && document.body.classList.contains('logged-in');
    var spans = document.querySelectorAll('span');
    for (var i = 0; i < spans.length && n === null; i++) {
      if (spans[i].textContent.trim() === 'cr' && spans[i].parentElement) {
        var m = spans[i].parentElement.textContent.replace(/\s+/g, ' ').match(/([\d,]+)\s*cr/);
        if (m) n = m[1];
      }
    }
    var chip = document.querySelector('#ds-head .cr');
    if (n !== null && chip) { chip.querySelector('span').textContent = n + ' cr'; chip.classList.add('on'); }
    if (window.DSNative && DSNative.setAccount) {
      try { DSNative.setAccount(loggedIn ? '1' : '0', n === null ? '' : n); } catch (e) { }
    }
  }

  /* AI Presentation mode buttons: short labels */
  function tidyModes() {
    var L = { deck: 'Full deck', slide: 'Individual slides', chart: 'AI charts', anim: 'Slide animation' };
    document.querySelectorAll('#dsqs .md button[data-m]').forEach(function (b) {
      var k = b.getAttribute('data-m');
      if (L[k] && !b.__ds) { b.__ds = 1; b.textContent = L[k]; }
    });
    if (document.querySelector('#dsqs .md button[data-m]') === null && !tidyModes.n) {
      tidyModes.n = 1; setTimeout(function () { tidyModes.n = 0; tidyModes(); }, 1000);
    }
  }

  /* hide the app bars while a full-screen editor / preview is open */
  function overlayCheck() {
    var on = false, w = innerWidth, h = innerHeight;
    var els = document.elementsFromPoint ? document.elementsFromPoint(w / 2, h / 2) : [];
    for (var i = 0; i < els.length && !on; i++) {
      var e = els[i];
      while (e && e !== document.body && !on) {
        if (e.id !== 'ds-head' && e.id !== 'ds-tabs') {
          var cs = getComputedStyle(e);
          if (cs.position === 'fixed' && e.offsetWidth >= w * 0.95 && e.offsetHeight >= h * 0.85 && cs.visibility !== 'hidden' && cs.display !== 'none') on = true;
        }
        e = e.parentElement;
      }
    }
    doc.classList.toggle('ds-overlay', on);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addUI); else addUI();

  /* ---------- marketplace: hide the category panel when scrolling down, show it when scrolling up ---------- */
  var lastY = new WeakMap();
  document.addEventListener('scroll', function (e) {
    var el = e.target;
    if (!el || !el.closest || !el.closest('.ds-mkt-main')) return;
    var y = el.scrollTop || 0, prev = lastY.has(el) ? lastY.get(el) : y, d = y - prev;
    lastY.set(el, y);
    if (y < 30) doc.classList.remove('ds-sb-hide');
    else if (d > 6) doc.classList.add('ds-sb-hide');
    else if (d < -10) doc.classList.remove('ds-sb-hide');
  }, true);

  /* ---------- deep links from the app's Create screen (#ds-mode=slide|anim|chart|deck) ---------- */
  var mode = (location.hash.match(/ds-mode=(\w+)/) || [])[1];
  if (mode) {
    var tries = 0;
    var t = setInterval(function () {
      var b = document.querySelector('button[data-m="' + mode + '"]');
      if (b || ++tries > 40) {
        clearInterval(t);
        if (b) { b.click(); history.replaceState(null, '', location.pathname + location.search); }
      }
    }, 250);
  }

  /* ---------- downloads ---------- */
  if (!window.DSNative) return;
  function guessName(a, href) {
    var n = (a && a.getAttribute && a.getAttribute('download')) || '';
    if (!n && href && !/^(blob|data):/.test(href)) n = decodeURIComponent(href.split('?')[0].split('/').pop() || '');
    return n || ('designstager-' + Date.now());
  }
  function sendBlob(blob, name) {
    toast('Preparing download…');
    var r = new FileReader();
    r.onload = function () {
      var s = String(r.result); var i = s.indexOf(',');
      DSNative.saveFile(s.slice(i + 1), name, blob.type || 'application/octet-stream');
    };
    r.onerror = function () { toast('Download failed. Please try again.'); };
    r.readAsDataURL(blob);
  }
  function handle(href, name) {
    if (/^blob:/.test(href)) {
      fetch(href).then(function (x) { return x.blob(); }).then(function (b) { sendBlob(b, name); })
        .catch(function () { toast('Download failed. Please try again.'); });
      return true;
    }
    if (/^data:/.test(href)) {
      var m = href.match(/^data:([^;,]*)(;base64)?,(.*)$/);
      if (!m) return false;
      var data = m[2] ? m[3] : btoa(unescape(decodeURIComponent(m[3])));
      DSNative.saveFile(data, name, m[1] || 'application/octet-stream');
      return true;
    }
    if (/^https?:/.test(href)) { DSNative.downloadUrl(href, name, navigator.userAgent); toast('Downloading ' + name + '…'); return true; }
    return false;
  }
  function wants(a) {
    if (!a || !a.href) return false;
    return /^(blob|data):/.test(a.href) || a.hasAttribute('download');
  }
  var origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (wants(this) && handle(this.href, guessName(this, this.href))) return;
    return origClick.apply(this, arguments);
  };
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (wants(a) && handle(a.href, guessName(a, a.href))) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  var origOpen = window.open;
  window.open = function (u) {
    if (typeof u === 'string' && /^blob:/.test(u)) { handle(u, guessName(null, u)); return null; }
    return origOpen.apply(window, arguments);
  };
  window.__dsSaveBlob = sendBlob;
})();
