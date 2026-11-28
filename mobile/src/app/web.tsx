// A designstager.com page inside the app, already logged in.
// Used by the AI tools until each one gets its own native screen.
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, Platform, View } from 'react-native';
import { WebView as RNWebView, WebViewMessageEvent } from 'react-native-webview';

// The library's type definitions don't match this React version yet; the component itself works.
const WebView = RNWebView as unknown as React.ComponentType<any>;
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { T } from '../components/ui';
import { SITE, webUrl } from '../lib/api';
import { downloadAndShare, saveBase64AndShare } from '../lib/download';
import { C } from '../lib/theme';

// Runs inside the page: hides the website header/footer and the site-owner assistant,
// and hands downloads (PPTX, DOCX, images) to the app.
const INJECT = `
(function(){
  if (window.__dsAppWeb) return; window.__dsAppWeb = true;
  var css = 'html body #masthead, html body .site-header, html body .elementor-location-header,' +
    'html body .elementor-location-footer, html body footer.site-footer, html body #colophon,' +
    '[class*="kodee"], [id*="kodee"], [id*="hostinger-chatbot"], [class*="hostinger-chatbot"]{display:none !important}' +
    'html body{display:block !important}';
  function addCss(){ if (document.getElementById('ds-app-web')) return; var s=document.createElement('style'); s.id='ds-app-web'; s.textContent=css; (document.head||document.documentElement).appendChild(s); }
  addCss(); document.addEventListener('DOMContentLoaded', addCss);
  setInterval(function(){
    document.documentElement.classList.remove('kodee-sidebar-active');
    if (document.body) document.body.classList.remove('kodee-sidebar-active');
  }, 800);
  function post(o){ try { window.ReactNativeWebView.postMessage(JSON.stringify(o)); } catch(e){} }
  function name(a, href){
    var n = (a && a.getAttribute && a.getAttribute('download')) || '';
    if (!n && href && !/^(blob|data):/.test(href)) n = decodeURIComponent(href.split('?')[0].split('/').pop() || '');
    return n || ('designstager-' + Date.now());
  }
  function sendBlob(b, n){
    post({ t:'toast', msg:'Preparing download…' });
    var r = new FileReader();
    r.onload = function(){ var s = String(r.result); post({ t:'file', name:n, mime:b.type||'application/octet-stream', data:s.slice(s.indexOf(',')+1) }); };
    r.readAsDataURL(b);
  }
  function handle(href, n){
    if (/^blob:/.test(href)) { fetch(href).then(function(x){return x.blob();}).then(function(b){ sendBlob(b, n); }); return true; }
    if (/^data:/.test(href)) { var m = href.match(/^data:([^;,]*)(;base64)?,(.*)$/); if(!m) return false;
      post({ t:'file', name:n, mime:m[1]||'application/octet-stream', data: m[2] ? m[3] : btoa(unescape(decodeURIComponent(m[3]))) }); return true; }
    if (/^https?:/.test(href)) { post({ t:'url', url:href, name:n }); return true; }
    return false;
  }
  function wants(a){ return a && a.href && (/^(blob|data):/.test(a.href) || a.hasAttribute('download')); }
  var oc = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function(){ if (wants(this) && handle(this.href, name(this, this.href))) return; return oc.apply(this, arguments); };
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest ? e.target.closest('a') : null;
    if (wants(a) && handle(a.href, name(a, a.href))) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  var oo = window.open;
  window.open = function(u){ if (typeof u === 'string' && /^blob:/.test(u)) { handle(u, name(null, u)); return null; } return oo.apply(window, arguments); };
})(); true;`;

export default function Web() {
  const { path, title } = useLocalSearchParams<{ path: string; title?: string }>();
  const nav = useNavigation();
  const ref = useRef<any>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [canBack, setCanBack] = useState(false);
  const [note, setNote] = useState('');

  useLayoutEffect(() => {
    nav.setOptions({ title: title || '' });
  }, [nav, title]);

  useEffect(() => {
    webUrl(path || '/').then(setSrc);
  }, [path]);

  // Android back button goes back inside the page first.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canBack) {
        ref.current?.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canBack]);

  function flash(m: string) {
    setNote(m);
    setTimeout(() => setNote(''), 2600);
  }

  async function onMessage(e: WebViewMessageEvent) {
    let m: any;
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    try {
      if (m.t === 'toast') flash(m.msg);
      else if (m.t === 'file') await saveBase64AndShare(m.data, m.name, m.mime);
      else if (m.t === 'url') {
        flash(`Downloading ${m.name}…`);
        await downloadAndShare(m.url, m.name);
      }
    } catch {
      flash('Download failed. Please try again.');
    }
  }

  if (!src) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.orange} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <WebView
        ref={ref}
        source={{ uri: src }}
        injectedJavaScriptBeforeContentLoaded={INJECT}
        injectedJavaScript={INJECT}
        onMessage={onMessage}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => (
          <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
            <ActivityIndicator color={C.orange} />
          </View>
        )}
        onNavigationStateChange={(s: any) => setCanBack(s.canGoBack)}
        onShouldStartLoadWithRequest={(r: any) => {
          // No buying inside the app: pricing and checkout pages don't open here.
          if (/\/(pricing|checkout|cart)(\/|\?|$)|razorpay\.com/i.test(r.url) && r.isTopFrame !== false) {
            flash('Plans and purchases are not available in the app.');
            return false;
          }
          // Pages on designstager.com stay in the app; anything else opens in the phone's browser.
          if (r.url.startsWith(SITE) || r.url.startsWith('about:') || r.url.startsWith('blob:') || r.url.startsWith('data:')) return true;
          if (/^https?:\/\/([a-z0-9-]+\.)*designstager\.com/i.test(r.url)) return true;
          if (r.isTopFrame === false) return true;
          Linking.openURL(r.url).catch(() => null);
          return false;
        }}
      />
      {note ? (
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: 30, backgroundColor: C.navy, borderRadius: 12, padding: 12 }}>
          <T w="medium" size={13} color="#fff" style={{ textAlign: 'center' }}>
            {note}
          </T>
        </View>
      ) : null}
    </View>
  );
}
