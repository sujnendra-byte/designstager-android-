/* DesignStager Android app: injected into designstager.com pages by MainActivity.
   Adds the app's bottom tab bar and makes in-browser downloads (blob/data links) save to the phone. */
(function () {
  if (window.__dsApp) return;
  window.__dsApp = true;
  var HOME = 'https://localhost/index.html';
  var doc = document.documentElement;
  doc.classList.add('ds-app');

  /* ---------- bottom tab bar ---------- */
  var css = '' +
    'html.ds-app body{padding-bottom:calc(68px + env(safe-area-inset-bottom,0px)) !important}' +
    'html.ds-app .elementor-location-footer, html.ds-app footer.site-footer{display:none !important}' +
    '#ds-tabs{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:flex;background:#fff;' +
    'border-top:1px solid #e4e6ef;padding:6px 4px calc(env(safe-area-inset-bottom,0px) + 6px);' +
    'font-family:Poppins,system-ui,sans-serif;box-shadow:0 -4px 16px rgba(20,26,48,.06)}' +
    '#ds-tabs a{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:11px;' +
    'font-weight:500;color:#6b7190;text-decoration:none;padding:4px 0;line-height:1.2}' +
    '#ds-tabs a.on{color:#e7552f}' +
    '#ds-tabs svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    '#ds-toast{position:fixed;left:50%;bottom:calc(84px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);' +
    'z-index:2147483001;background:#141a30;color:#fff;font:500 13px Poppins,system-ui,sans-serif;' +
    'padding:10px 16px;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.25);display:none;max-width:86vw;text-align:center}';
  var tabs = [
    ['Home', HOME, '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>', /^$/],
    ['Create', 'https://designstager.com/ai-presentation/', '<path d="M12 3l2.2 5.3L20 9l-4.5 3.8L17 19l-5-3-5 3 1.5-6.2L4 9l5.8-.7z"/>', /^\/(ai-|ai-studio)/],
    ['Market', 'https://designstager.com/marketplace/', '<path d="M4 7h16l-1.5 12a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2z"/><path d="M9 7a3 3 0 0 1 6 0"/>', /^\/marketplace/],
    ['Creations', 'https://designstager.com/my-creations/', '<path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', /^\/my-creations/],
    ['Account', 'https://designstager.com/my-account/', '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>', /^\/(my-account|login)/]
  ];
  function addUI() {
    if (document.getElementById('ds-tabs') || !document.body) return;
    var st = document.createElement('style'); st.id = 'ds-app-style'; st.textContent = css;
    document.head.appendChild(st);
    var nav = document.createElement('nav'); nav.id = 'ds-tabs';
    var path = location.pathname;
    tabs.forEach(function (t) {
      var a = document.createElement('a'); a.href = t[1];
      if (t[3].test(path)) a.className = 'on';
      a.innerHTML = '<svg viewBox="0 0 24 24">' + t[2] + '</svg>' + t[0];
      nav.appendChild(a);
    });
    document.body.appendChild(nav);
    var toast = document.createElement('div'); toast.id = 'ds-toast'; document.body.appendChild(toast);
  }
  function toast(msg) {
    var t = document.getElementById('ds-toast'); if (!t) return;
    t.textContent = msg; t.style.display = 'block';
    clearTimeout(t._h); t._h = setTimeout(function () { t.style.display = 'none'; }, 2600);
  }
  window.__dsToast = toast;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addUI); else addUI();

  /* ---------- downloads ---------- */
  if (!window.DSNative) return;
  function guessName(a, href, mime) {
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
  // programmatic a.click() on detached links (used by most JS "save as" code)
  var origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (wants(this) && handle(this.href, guessName(this, this.href))) return;
    return origClick.apply(this, arguments);
  };
  // real taps on download links
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (wants(a) && handle(a.href, guessName(a, a.href))) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  // window.open(blobUrl)
  var origOpen = window.open;
  window.open = function (u) {
    if (typeof u === 'string' && /^blob:/.test(u)) { handle(u, guessName(null, u)); return null; }
    return origOpen.apply(window, arguments);
  };
  // navigator.msSaveOrOpenBlob-style helpers some libraries check for
  window.__dsSaveBlob = sendBlob;
})();
