/* DesignStager Android app: injected into designstager.com pages (at document start when supported).
   - opens the app's own Home instead of the website home page (e.g. after login / logout)
   - app header (back, page title, credits) + bottom tab bar, clean light look
   - compact AI Presentation mode buttons, compact marketplace categories that hide on scroll
   - saves in-browser downloads (blob/data links) to the phone */
(function () {
  if (window.__dsApp) return;
  window.__dsApp = true;
  /* remember the last script errors for the debug panel (long-press anywhere) */
  var dsErrs = [];
  window.addEventListener('error', function (e) {
    dsErrs.push((e.message || 'error') + ' @ ' + String(e.filename || '').split('/').pop() + ':' + (e.lineno || ''));
    if (dsErrs.length > 6) dsErrs.shift();
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    dsErrs.push('promise: ' + String(e.reason && (e.reason.message || e.reason)).slice(0, 160));
    if (dsErrs.length > 6) dsErrs.shift();
  });
  var HOME = 'https://localhost/index.html';
  var CREATE = 'https://localhost/create.html';
  var path = location.pathname;

  /* ---------- website home page -> app home ---------- */
  if ((path === '/' || path === '') && !/[?&](s|p|page_id|add-to-cart)=/.test(location.search)) {
    location.replace(HOME);
    return;
  }

  /* ---------- always use the light theme in the app ---------- */
  /* light theme (the debug panel's "Test A" can switch this off for testing) */
  var noTheme = false;
  try { noTheme = localStorage.getItem('ds-app-notheme') === '1'; } catch (e) { }
  if (!noTheme) { try { localStorage.setItem('ds-theme', 'light'); } catch (e) { } }
  var doc = document.documentElement;
  doc.classList.add('ds-app');
  if (!noTheme) doc.classList.remove('ds-dark', 'mode-dark');

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
          if (cs.position === 'fixed' && e.offsetWidth >= w * 0.95 && e.offsetHeight >= h * 0.85 && cs.visibility !== 'hidden' && cs.display !== 'none') { on = true; overlayCheck.el = e; }
        }
        e = e.parentElement;
      }
    }
    doc.classList.toggle('ds-overlay', on);
    // Diagnostics: a full-screen layer that is not the slide editor hides the app bars ("white screen").
    // If it stays for 2 seconds, open the debug panel by itself (once per page).
    var editorOpen = !!document.querySelector('#dsp-editor-fullscreen.dsp-open');
    if (on && !editorOpen) {
      overlayCheck.n = (overlayCheck.n || 0) + 1;
      if (overlayCheck.n === 3 && !overlayCheck.shown) { overlayCheck.shown = 1; dsDebug(); }
    } else overlayCheck.n = 0;
  }


  /* ---------- AI Presentation: the 4 mode buttons appear instantly ----------
     The site builds its own mode buttons with a script near the end of a very large page, so on a phone they
     appear late and one by one. The app shows its own 4 buttons as soon as the page starts, hides the site's,
     and passes each tap to the site's button (waiting for it if the page is still loading). */
  if (/^\/ai-presentation\/?$/.test(path)) {
    var MODES = [['deck', 'Full deck'], ['slide', 'Individual slides'], ['chart', 'AI charts'], ['anim', 'Slide animation']];
    var mSt = document.createElement('style');
    mSt.textContent = 'html.ds-app #dsqs .md{display:none !important}' +
      '#ds-modes{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px 12px 4px;background:#f4f5f9;box-sizing:border-box}' +
      '#ds-modes button{min-height:44px;padding:8px 4px;margin:0;border-radius:10px;border:1px solid #d5d9e4;background:#fff;' +
      'color:#141a30;font:700 10.5px/1.25 Poppins,system-ui,sans-serif;letter-spacing:.4px;text-transform:uppercase;cursor:pointer}' +
      '#ds-modes button.on{background:#141a30;color:#fff;border-color:#141a30}' +
      '#ds-modes button.wait{opacity:.6}' +
      'html.ds-overlay #ds-modes, html.ds-ed-view #ds-modes, html.ds-ed-full #ds-modes, html.ds-modes-off #ds-modes{display:none !important}';
    (document.head || doc).appendChild(mSt);
    var startMode = (location.hash.match(/ds-mode=(\w+)/) || [])[1] || 'deck';
    var modeBar = document.createElement('div'); modeBar.id = 'ds-modes';
    MODES.forEach(function (m) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-dm', m[0]); b.textContent = m[1];
      if (m[0] === startMode) b.className = 'on';
      modeBar.appendChild(b);
    });
    var pendingMode = null, modeTimer = null;
    function siteModeBtn(k) { return document.querySelector('#dsqs .md button[data-m="' + k + '"]'); }
    function markMode(k) {
      modeBar.querySelectorAll('button').forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-dm') === k);
        b.classList.toggle('wait', b.getAttribute('data-dm') === pendingMode);
      });
    }
    function runMode(k) {
      var sb = siteModeBtn(k);
      if (sb) { pendingMode = null; sb.click(); markMode(k); return; }
      pendingMode = k; markMode(k); toast('Loading…');
      clearInterval(modeTimer);
      modeTimer = setInterval(function () {
        var s2 = siteModeBtn(pendingMode);
        if (s2) { clearInterval(modeTimer); var k2 = pendingMode; pendingMode = null; s2.click(); markMode(k2); }
      }, 150);
    }
    modeBar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-dm]'); if (b) runMode(b.getAttribute('data-dm'));
    });
    // put the bar at the top of the page as soon as <body> exists
    (function placeBar() {
      if (document.body) { document.body.insertBefore(modeBar, document.body.firstChild); return; }
      var mo = new MutationObserver(function () { if (document.body) { mo.disconnect(); placeBar(); } });
      mo.observe(doc, { childList: true });
    })();
    // keep the highlighted button in step with the site, and hide the bar on screens where the site hides its own
    setInterval(function () {
      var md = document.querySelector('#dsqs .md');
      if (!md) return;
      var dsqs = document.getElementById('dsqs');
      doc.classList.toggle('ds-modes-off', !dsqs || dsqs.offsetParent === null && getComputedStyle(dsqs).position !== 'fixed');
      if (!pendingMode) {
        var cur = md.querySelector('button[data-m].on, button[data-m].active, button[data-m][aria-pressed="true"]');
        if (cur) markMode(cur.getAttribute('data-m'));
      }
    }, 400);
  }

  /* ---------- presentation editor: simple "view" screen first, full editor on demand ---------- */
  var edCss = '' +
    /* view mode: only the slides + app action bar */
    'html.ds-ed-view #dsp-ppt-toolbar, html.ds-ed-view #dsel-bar, html.ds-ed-view #dsel-dock, html.ds-ed-view #dsel-keys,' +
    'html.ds-ed-view #dsel-panel, html.ds-ed-view #dsp-ppt-panel-right, html.ds-ed-view #dsp-vp-panel,' +
    'html.ds-ed-view #dsp-ppt-panel-left > *:not(#dsp-ppt-thumbs):not(#ds-ed-hint), html.ds-ed-view .vp-thumb-del, html.ds-ed-view .dsx-tact,' +
    'html.ds-ed-view #ds-suji-btn{display:none !important}' +
    'html.ds-ed-view #dsp-editor-fullscreen{background:#f4f5f9 !important;left:0 !important;right:0 !important;width:100vw !important}' +
    'html.ds-ed-view #dsp-ppt-workspace{display:block !important;height:100vh !important;padding:0 !important}' +
    'html.ds-ed-view #dsp-ppt-panel-left{width:100vw !important;display:block !important;max-width:none !important;min-width:0 !important;height:100vh !important;' +
    'overflow-y:auto !important;overflow-x:hidden !important;border:0 !important;background:#f4f5f9 !important;' +
    'padding:68px 0 104px !important;box-sizing:border-box !important;position:relative !important}' +
    'html.ds-ed-view #dsp-ppt-thumbs{display:flex !important;flex-direction:column !important;flex-wrap:nowrap !important;' +
    'gap:16px !important;padding:4px 14px !important;overflow:visible !important;height:auto !important;max-height:none !important;width:auto !important}' +
    'html.ds-ed-view .dsp-thumb-item{width:auto !important;height:auto !important;margin:0 !important;padding:0 !important;' +
    'background:none !important;border:0 !important;box-shadow:none !important;flex:none !important}' +
    'html.ds-ed-view .dsp-thumb-num{display:block !important;position:static !important;font:600 12px Poppins,system-ui,sans-serif !important;' +
    'color:#6b7190 !important;margin:0 0 6px 2px !important;background:none !important}' +
    'html.ds-ed-view .dsp-thumb-box{width:100% !important;border-radius:6px !important;overflow:hidden !important;' +
    'box-shadow:0 4px 16px rgba(20,26,48,.16) !important;outline:0 !important}' +
    /* view mode bars */
    '#ds-ed-top,#ds-ed-act,#ds-ed-done{font-family:Poppins,system-ui,sans-serif;box-sizing:border-box}' +
    '#ds-ed-top{position:fixed;left:0;right:0;top:0;height:56px;z-index:100002;display:none;align-items:center;gap:6px;' +
    'background:#141a30 !important;padding:0 10px 0 6px}' +
    '#ds-ed-top *{color:#fff !important}' +
    '#ds-ed-top .b{width:40px;height:40px;display:grid;place-items:center;border:0;background:none !important;padding:0}' +
    '#ds-ed-top .t{flex:1;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '#ds-ed-top .s{border:1px solid rgba(255,255,255,.35) !important;background:none !important;border-radius:999px;padding:6px 14px;font:500 13px Poppins,sans-serif}' +
    '#ds-ed-act{position:fixed;left:0;right:0;bottom:0;z-index:100002;display:none;gap:8px;background:#fff !important;' +
    'border-top:1px solid #e4e6ef;padding:10px 12px calc(env(safe-area-inset-bottom,0px) + 10px);box-shadow:0 -4px 16px rgba(20,26,48,.08)}' +
    '#ds-ed-act button{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;border:0;border-radius:12px;padding:8px 2px;' +
    'background:#f1f2f7 !important;color:#141a30 !important;font:600 11.5px Poppins,system-ui,sans-serif}' +
    '#ds-ed-act button.p{background:#e7552f !important;color:#fff !important}' +
    '#ds-ed-act svg,#ds-ed-top svg,#ds-ed-done svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}' +
    'html.ds-ed-view #ds-ed-top, html.ds-ed-view #ds-ed-act{display:flex}' +
    '#ds-ed-hint{text-align:center;color:#6b7190;font:500 12px Poppins,sans-serif;margin:2px 0 10px}' +
    /* download menu as a bottom sheet in view mode */
    'html.ds-ed-view #dsx-menu{position:fixed !important;left:12px !important;right:12px !important;top:auto !important;' +
    'bottom:calc(env(safe-area-inset-bottom,0px) + 92px) !important;width:auto !important;max-width:none !important;z-index:100003 !important}' +
    /* full editor: scrollable toolbars + Done button */
    'html.ds-ed-full #dsp-ppt-toolbar, html.ds-ed-full #dsel-dock .dsel-right{overflow-x:auto !important;flex-wrap:nowrap !important;scrollbar-width:none}' +
    'html.ds-ed-full #dsp-ppt-toolbar > *, html.ds-ed-full #dsel-dock .dsel-right > *{flex:0 0 auto !important}' +
    '#ds-ed-done{position:fixed;right:10px;bottom:calc(env(safe-area-inset-bottom,0px) + 64px);z-index:100002;display:none;align-items:center;gap:6px;' +
    'border:0;border-radius:999px;padding:10px 16px;background:#141a30 !important;color:#fff !important;font:600 13px Poppins,sans-serif;' +
    'box-shadow:0 6px 18px rgba(0,0,0,.3)}' +
    'html.ds-ed-full #ds-ed-done{display:flex}';
  /* ---------- Slide Animation: keep the preview on screen while choosing styles ---------- */
  edCss += '' +
    '@media (max-width:1100px){' +
    'html.ds-app #dsan-app .dsan-center{display:contents !important}' +
    'html.ds-app #dsan-app .dsan-pin{position:sticky !important;top:56px !important;z-index:20 !important;background:#fff !important;' +
    'margin:0 -12px !important;padding:8px 12px 10px !important;box-shadow:0 8px 16px -10px rgba(20,26,48,.35) !important}' +
    'html.ds-overlay #dsan-app .dsan-pin, .dsan-ov #dsan-app .dsan-pin{top:0 !important}' +
    'html.ds-app #dsan-app .dsan-pin .dsan-ctl{display:flex !important;flex-wrap:wrap !important;gap:8px !important;margin-top:8px !important}' +
    'html.ds-app #dsan-app .dsan-pin button{padding:8px 14px !important;font-size:13px !important;min-height:0 !important}' +
    '}' +
    '@media (max-width:860px){' +
    'html.ds-app .dsan-ov .dsan-body > .dsan-main{position:sticky !important;top:0 !important;z-index:20 !important;' +
    'background:#fff !important;box-shadow:0 8px 16px -10px rgba(20,26,48,.35) !important}' +
    'html.ds-app .dsan-ov .dsan-ctl{flex-wrap:wrap !important;gap:8px !important}' +
    'html.ds-app .dsan-ov .dsan-ctl button{padding:7px 12px !important;font-size:12.5px !important}' +
    '}';
  // choosing a style plays it straight away in the preview
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var area = t.closest('.dsan-grid, #dsan-side, .dsan-side');
    if (!area || t.closest('.dsan-filt, .dsan-pin, .dsan-ctl')) return;
    var chip = t.closest('button');
    if (chip && /^(all|best fit|fade|rise|slide in|wipe|reveal|zoom|simple|subtle|moderate|bold|all 50)$/i.test(chip.textContent.trim())) return;
    setTimeout(function () {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        if (b.offsetParent && /^\W*play (animation|slide)\b/i.test(b.textContent.trim())) { b.click(); break; }
      }
    }, 250);
  }, true);

  var edSt = document.createElement('style'); edSt.textContent = edCss; (document.head || doc).appendChild(edSt);

  var IC = {
    back: '<path d="M15 5l-7 7 7 7"/>',
    dl: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    anim: '<path d="M5 4l14 8-14 8z"/><path d="M2 8v8" opacity=".5"/>',
    prev: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M10 9l5 2-5 2zM8 21h8"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    done: '<path d="M5 12l5 5 9-10"/>'
  };
  var fullEdit = false, edOn = false;
  function siteClick(sel) { var b = document.querySelector(sel); if (b) b.click(); return !!b; }
  function setOrient(o) { try { if (window.DSNative && DSNative.setOrientation) DSNative.setOrientation(o); } catch (e) { } }
  function buildEdBars() {
    if (document.getElementById('ds-ed-top')) return;
    var top = document.createElement('div'); top.id = 'ds-ed-top';
    top.innerHTML = '<button class="b" aria-label="Back"><svg viewBox="0 0 24 24">' + IC.back + '</svg></button><div class="t"></div><button class="s">Save</button>';
    top.querySelector('.b').onclick = function () { siteClick('.dsp-tb-back'); };
    top.querySelector('.s').onclick = function () { siteClick('#dsp-savebtn'); toast('Saved'); };
    var act = document.createElement('div'); act.id = 'ds-ed-act';
    act.innerHTML =
      '<button data-a="dl"><svg viewBox="0 0 24 24">' + IC.dl + '</svg>Download</button>' +
      '<button data-a="anim"><svg viewBox="0 0 24 24">' + IC.anim + '</svg>Animate</button>' +
      '<button data-a="prev"><svg viewBox="0 0 24 24">' + IC.prev + '</svg>Preview</button>' +
      '<button data-a="edit" class="p"><svg viewBox="0 0 24 24">' + IC.edit + '</svg>Edit design</button>';
    act.onclick = function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var a = b.getAttribute('data-a');
      if (a === 'dl') siteClick('#dsp-buildbtn');
      else if (a === 'anim') siteClick('#dsan-tb');
      else if (a === 'prev') siteClick('#dssp-tb');
      else if (a === 'edit') enterFull();
    };
    var done = document.createElement('button'); done.id = 'ds-ed-done';
    done.innerHTML = '<svg viewBox="0 0 24 24">' + IC.done + '</svg>Done';
    done.onclick = function () { siteClick('#dsp-savebtn'); exitFull(); };
    document.body.appendChild(top); document.body.appendChild(act); document.body.appendChild(done);
  }
  function fitThumbs() {
    var list = document.getElementById('dsp-ppt-thumbs');
    if (!list || document.getElementById('ds-ed-hint')) return;
    var hint = document.createElement('div'); hint.id = 'ds-ed-hint'; hint.textContent = 'Tap a slide to edit it';
    list.parentNode.insertBefore(hint, list);
  }
  function enterFull() { fullEdit = true; doc.classList.remove('ds-ed-view'); doc.classList.add('ds-ed-full'); setOrient('landscape'); }
  function exitFull() { fullEdit = false; doc.classList.remove('ds-ed-full'); doc.classList.add('ds-ed-view'); setOrient('auto'); setTimeout(fitThumbs, 400); }
  document.addEventListener('click', function (e) {
    if (!doc.classList.contains('ds-ed-view')) return;
    var it = e.target.closest && e.target.closest('.dsp-thumb-item');
    if (it) setTimeout(enterFull, 60);   // site selects the slide, then open the full editor on it
  }, true);
  function editorCheck() {
    var ed = document.querySelector('#dsp-editor-fullscreen.dsp-open');
    if (ed && !edOn) {
      edOn = true; buildEdBars();
      var t = document.getElementById('dsp-etitle');
      document.querySelector('#ds-ed-top .t').textContent = t ? t.textContent.trim() : 'Presentation';
      if (!fullEdit) { doc.classList.add('ds-ed-view'); setTimeout(fitThumbs, 300); }
    } else if (!ed && edOn) {
      edOn = false; fullEdit = false; doc.classList.remove('ds-ed-view', 'ds-ed-full'); setOrient('auto');
    } else if (ed && !fullEdit) {
      var t2 = document.getElementById('dsp-etitle');
      if (t2) document.querySelector('#ds-ed-top .t').textContent = t2.textContent.trim();
    }
  }
  setInterval(editorCheck, 700);

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

  /* ---------- debug panel: long-press (about 1 second) anywhere to see what is on screen ---------- */
  function dsDesc(e) {
    if (!e || !e.tagName) return String(e);
    var cs = getComputedStyle(e), r = e.getBoundingClientRect();
    return e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
      (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : '') +
      ' [' + cs.position + ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ' disp:' + cs.display +
      ' vis:' + cs.visibility + ' op:' + cs.opacity + ' bg:' + cs.backgroundColor + ' z:' + cs.zIndex + ']';
  }
  function dsDebug() {
    var old = document.getElementById('ds-debug'); if (old) { old.remove(); return; }
    var b = document.body, bs = b ? getComputedStyle(b) : null;
    var pts = document.elementsFromPoint ? document.elementsFromPoint(innerWidth / 2, innerHeight / 2).slice(0, 4) : [];
    // big layers anywhere (also ones that ignore taps, which the centre check cannot see)
    var big = [];
    [].forEach.call(document.querySelectorAll('html > *, body *'), function (e) {
      if (big.length >= 6 || e.id === 'ds-debug') return;
      var cs = getComputedStyle(e); if (cs.position !== 'fixed' && cs.position !== 'sticky') return;
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return;
      var r = e.getBoundingClientRect();
      if (r.width >= innerWidth * .9 && r.height >= innerHeight * .5 && r.bottom > 0 && r.top < innerHeight) big.push(dsDesc(e) + ' pe:' + cs.pointerEvents);
    });
    var pse = ['html::before', 'html::after', 'body::before', 'body::after'].map(function (k) {
      var el = k.indexOf('html') === 0 ? doc : b, ps = el ? getComputedStyle(el, k.slice(k.indexOf('::'))) : null;
      return ps && ps.content !== 'none' && ps.content !== 'normal' ? k + ' ' + ps.position + ' bg:' + ps.backgroundColor + ' z:' + ps.zIndex : '';
    }).filter(Boolean);
    var gen = document.getElementById('ds-light-gen');
    var lines = [
      'URL: ' + location.href.split('?')[0],
      'html: ' + doc.className + (noTheme ? '  [TEST A ON]' : ''),
      'body: ' + (b ? 'disp:' + bs.display + ' vis:' + bs.visibility + ' op:' + bs.opacity + ' bg:' + bs.backgroundColor + ' h:' + b.scrollHeight : 'none'),
      'view: ' + innerWidth + 'x' + innerHeight + ' scrollY:' + Math.round(scrollY) + ' ready:' + document.readyState,
      'bars: head=' + (document.getElementById('ds-head') ? dsDesc(document.getElementById('ds-head')) + ' color:' + getComputedStyle(document.querySelector('#ds-head .t') || doc).color : 'none'),
      'tabs: ' + (document.getElementById('ds-tabs') ? dsDesc(document.getElementById('ds-tabs')) : 'none'),
      'light css: ' + (gen ? gen.textContent.length : 0) + ' chars, white-text marks: ' + document.querySelectorAll('[data-ds-fix="w"]').length + ', dark-text marks: ' + document.querySelectorAll('[data-ds-fix="d"]').length,
      'big layers:' + (big.length ? '' : ' none')
    ].concat(big.map(function (x) { return ' * ' + x; }))
      .concat(pse.length ? ['pseudo: ' + pse.join(' | ')] : [])
      .concat(['center:']).concat(pts.map(function (e, i) { return ' ' + (i + 1) + ') ' + dsDesc(e) + ' color:' + getComputedStyle(e).color; }))
      .concat(['errors:']).concat(dsErrs.length ? dsErrs.map(function (x) { return ' - ' + x; }) : [' (none)']);
    var p = document.createElement('div'); p.id = 'ds-debug';
    p.style.cssText = 'all:initial;position:fixed;left:8px;right:8px;top:8px;z-index:2147483647;background:#fff8e6;color:#111;' +
      'border:2px solid #e7552f;border-radius:10px;padding:10px;font:11px/1.45 monospace;white-space:pre-wrap;word-break:break-all;' +
      'max-height:86vh;overflow:auto;box-shadow:0 8px 30px rgba(0,0,0,.35);display:block';
    var txt = document.createElement('div'); txt.style.cssText = 'all:initial;font:11px/1.45 monospace;white-space:pre-wrap;word-break:break-all;color:#111;display:block';
    txt.textContent = 'DesignStager debug - screenshot this, then try the tests\n\n' + lines.join('\n');
    p.appendChild(txt);
    function btn(label, fn) {
      var x = document.createElement('button'); x.textContent = label;
      x.style.cssText = 'all:initial;display:block;width:100%;box-sizing:border-box;margin-top:8px;padding:10px;border-radius:8px;background:#141a30;color:#fff;font:600 13px sans-serif;text-align:center';
      x.onclick = function (ev) { ev.stopPropagation(); fn(); };
      p.appendChild(x);
    }
    btn(noTheme ? 'Test A: turn light theme back ON (reload)' : 'Test A: turn light theme OFF (reload)', function () {
      try {
        if (noTheme) { localStorage.removeItem('ds-app-notheme'); localStorage.setItem('ds-theme', 'light'); }
        else { localStorage.setItem('ds-app-notheme', '1'); localStorage.setItem('ds-theme', 'dark'); }
      } catch (e) { }
      location.reload();
    });
    btn('Test B: remove automatic colours (no reload)', function () {
      [].forEach.call(document.querySelectorAll('#ds-light-gen, style[id^="ds-light"]'), function (s) { s.disabled = true; s.textContent = ''; });
      [].forEach.call(document.querySelectorAll('[data-ds-fix]'), function (e) { e.removeAttribute('data-ds-fix'); });
      p.remove();
    });
    btn('Test C: scroll to the top (no reload)', function () { scrollTo(0, 0); p.remove(); });
    btn('Close', function () { p.remove(); });
    doc.appendChild(p);   // on <html>, so it shows even if the page body is hidden
  }
  var lpT = null, lpX = 0, lpY = 0;
  document.addEventListener('touchstart', function (e) {
    var t = e.touches && e.touches[0]; if (!t || e.touches.length > 1) return;
    lpX = t.clientX; lpY = t.clientY; clearTimeout(lpT);
    lpT = setTimeout(dsDebug, 1100);
  }, { capture: true, passive: true });
  document.addEventListener('touchmove', function (e) {
    var t = e.touches && e.touches[0];
    if (t && (Math.abs(t.clientX - lpX) > 12 || Math.abs(t.clientY - lpY) > 12)) clearTimeout(lpT);
  }, { capture: true, passive: true });
  document.addEventListener('touchend', function () { clearTimeout(lpT); }, { capture: true, passive: true });
  window.__dsDebug = dsDebug;

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
