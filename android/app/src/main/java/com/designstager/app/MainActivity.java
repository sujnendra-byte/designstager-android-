package com.designstager.app;

import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import android.content.SharedPreferences;
import java.util.Arrays;
import java.util.HashSet;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends BridgeActivity {

    private static final String SITE_HOST = "designstager.com";
    private String injectJs = "";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setBackgroundColor(Color.parseColor("#141a30"));
        injectJs = readAsset("public/inject/app.js");

        WebView wv = getBridge().getWebView();
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(wv, true);
        wv.getSettings().setSupportMultipleWindows(false);
        // Ignore the phone's "font size" setting inside the web pages: it enlarges text in the
        // tiny template previews and makes it overlap. Also allow very small text in thumbnails.
        wv.getSettings().setTextZoom(100);
        wv.getSettings().setMinimumFontSize(1);
        wv.getSettings().setMinimumLogicalFontSize(1);

        // Native helpers for the injected script
        wv.addJavascriptInterface(new DSNative(this), "DSNative");

        // Inject the app UI + download hooks into designstager.com pages.
        // Preferred: at document start (before the page draws, so the website header never flashes).
        if (!injectJs.isEmpty() && WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
            try {
                WebViewCompat.addDocumentStartJavaScript(wv, injectJs,
                        new HashSet<>(Arrays.asList("https://designstager.com", "https://*.designstager.com")));
            } catch (Exception ignored) { }
        }
        // Fallback (and safety net): also after each page finishes loading. The script runs only once per page.
        getBridge().setWebViewClient(new DSWebViewClient(getBridge()));

        // Regular file downloads (links that return a file)
        wv.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            if (url.startsWith("blob:") || url.startsWith("data:")) {
                String js = "(function(){var a=document.createElement('a');a.href=" + jsString(url)
                        + ";a.download=" + jsString(URLUtil.guessFileName(url, contentDisposition, mimeType)) + ";a.click();})()";
                wv.evaluateJavascript(js, null);
                return;
            }
            enqueueDownload(url, URLUtil.guessFileName(url, contentDisposition, mimeType), mimeType, userAgent);
        });
    }

    @Override
    public void onPause() {
        super.onPause();
        CookieManager.getInstance().flush(); // keep the user logged in
    }

    private class DSWebViewClient extends BridgeWebViewClient {
        DSWebViewClient(Bridge bridge) { super(bridge); }

        @Override
        public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
            String u = request.getUrl().toString();
            if (u.startsWith("intent:")) {               // UPI / payment apps (Razorpay etc.)
                try {
                    Intent i = Intent.parseUri(u, Intent.URI_INTENT_SCHEME);
                    i.addCategory(Intent.CATEGORY_BROWSABLE);
                    i.setComponent(null);
                    try { startActivity(i); }
                    catch (ActivityNotFoundException e) {
                        String fb = i.getStringExtra("browser_fallback_url");
                        if (fb != null) view.loadUrl(fb);
                    }
                } catch (Exception ignored) { }
                return true;
            }
            return super.shouldOverrideUrlLoading(view, request);
        }

        @Override
        public android.webkit.WebResourceResponse shouldInterceptRequest(WebView view, android.webkit.WebResourceRequest request) {
            // Hostinger's site-owner assistant ("Kodee") is not for the app: on a phone its sidebar hides the
            // whole website (white screen). Don't load it inside the app.
            String u = request.getUrl().toString();
            if (u.contains("/wp-content/plugins/hostinger-ai-assistant/")) {
                String mime = u.contains(".css") ? "text/css" : "application/javascript";
                return new android.webkit.WebResourceResponse(mime, "utf-8",
                        new java.io.ByteArrayInputStream(new byte[0]));
            }
            return super.shouldInterceptRequest(view, request);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            if (isSite(url) && !injectJs.isEmpty()) view.evaluateJavascript(injectJs, null);
            // Diagnostics: say so when the app lands on a page that is neither the website nor the app's own screens
            if (url != null && !isSite(url) && !url.startsWith("https://localhost")) {
                Toast.makeText(MainActivity.this, "Opened: " + url, Toast.LENGTH_LONG).show();
            }
        }

        @Override
        public void onReceivedError(WebView view, android.webkit.WebResourceRequest request, android.webkit.WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (request.isForMainFrame()) {
                Toast.makeText(MainActivity.this, "Page failed to load (" + error.getErrorCode() + "): "
                        + error.getDescription(), Toast.LENGTH_LONG).show();
            }
        }

        @Override
        public void onReceivedHttpError(WebView view, android.webkit.WebResourceRequest request, android.webkit.WebResourceResponse resp) {
            super.onReceivedHttpError(view, request, resp);
            if (request.isForMainFrame()) {
                Toast.makeText(MainActivity.this, "Server error " + resp.getStatusCode() + " on " + request.getUrl().getPath(),
                        Toast.LENGTH_LONG).show();
            }
        }

        @Override
        public boolean onRenderProcessGone(WebView view, android.webkit.RenderProcessGoneDetail detail) {
            // The page crashed (often: out of memory). Restart the screen instead of leaving it blank / closing the app.
            Toast.makeText(MainActivity.this, detail.didCrash() ? "The page crashed, reopening…"
                    : "The page ran out of memory, reopening…", Toast.LENGTH_LONG).show();
            recreate();
            return true;
        }

        @Override
        public void doUpdateVisitedHistory(WebView view, String url, boolean isReload) {
            super.doUpdateVisitedHistory(view, url, isReload);
            if (isSite(url) && !injectJs.isEmpty()) view.evaluateJavascript(injectJs, null);
        }
    }

    private static boolean isSite(String url) {
        try {
            String h = Uri.parse(url).getHost();
            return h != null && (h.equals(SITE_HOST) || h.endsWith("." + SITE_HOST));
        } catch (Exception e) { return false; }
    }

    /** Called from JavaScript. */
    public class DSNative {
        private final Context ctx;
        DSNative(Context c) { ctx = c; }

        @JavascriptInterface
        public void saveFile(String base64, String name, String mime) {
            try {
                byte[] data = Base64.decode(base64, Base64.DEFAULT);
                Uri uri = saveToDownloads(data, cleanName(name, mime), mime);
                runOnUiThread(() -> showSaved(uri, cleanName(name, mime), mime));
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(ctx, "Download failed: " + e.getMessage(), Toast.LENGTH_LONG).show());
            }
        }

        /** Website pages report login state + credits; the app's own screens read them back. */
        @JavascriptInterface
        public void setAccount(String loggedIn, String credits) {
            SharedPreferences.Editor e = getSharedPreferences("ds", MODE_PRIVATE).edit();
            e.putString("loggedIn", loggedIn);
            if ("0".equals(loggedIn)) e.putString("credits", "");
            else if (credits != null && !credits.isEmpty()) e.putString("credits", credits);
            e.apply();
        }

        @JavascriptInterface
        public String getAccount() {
            SharedPreferences p = getSharedPreferences("ds", MODE_PRIVATE);
            return "{\"loggedIn\":\"" + p.getString("loggedIn", "") + "\",\"credits\":\"" + p.getString("credits", "").replaceAll("[^0-9,]", "") + "\"}";
        }

        /** "landscape" while the full slide editor is open, "auto" otherwise. */
        @JavascriptInterface
        public void setOrientation(String o) {
            runOnUiThread(() -> setRequestedOrientation("landscape".equals(o)
                    ? android.content.pm.ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                    : android.content.pm.ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED));
        }

        @JavascriptInterface
        public void downloadUrl(String url, String name, String userAgent) {
            runOnUiThread(() -> enqueueDownload(url, name, null, userAgent));
        }
    }

    private String cleanName(String name, String mime) {
        String n = (name == null || name.trim().isEmpty()) ? "designstager-" + System.currentTimeMillis() : name.trim();
        n = n.replaceAll("[\\\\/:*?\"<>|]", "_");
        if (!n.contains(".") && mime != null) {
            String ext = MimeTypeMap.getSingleton().getExtensionFromMimeType(mime);
            if (ext != null) n = n + "." + ext;
        }
        return n;
    }

    private Uri saveToDownloads(byte[] data, String name, String mime) throws Exception {
        if (mime == null || mime.isEmpty()) mime = "application/octet-stream";
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentResolver cr = getContentResolver();
            ContentValues v = new ContentValues();
            v.put(MediaStore.Downloads.DISPLAY_NAME, name);
            v.put(MediaStore.Downloads.MIME_TYPE, mime);
            v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/DesignStager");
            v.put(MediaStore.Downloads.IS_PENDING, 1);
            Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            if (uri == null) throw new Exception("could not create file");
            try (OutputStream os = cr.openOutputStream(uri)) { os.write(data); }
            v.clear();
            v.put(MediaStore.Downloads.IS_PENDING, 0);
            cr.update(uri, v, null, null);
            return uri;
        } else {
            File dir = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "DesignStager");
            if (!dir.exists()) dir.mkdirs();
            File f = new File(dir, name);
            try (FileOutputStream fos = new FileOutputStream(f)) { fos.write(data); }
            return FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", f);
        }
    }

    private void showSaved(Uri uri, String name, String mime) {
        new AlertDialog.Builder(this)
                .setTitle("Download complete")
                .setMessage(name + "\n\nSaved to Downloads/DesignStager")
                .setPositiveButton("Open", (d, w) -> {
                    Intent i = new Intent(Intent.ACTION_VIEW);
                    i.setDataAndType(uri, mime);
                    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    try { startActivity(Intent.createChooser(i, "Open with")); }
                    catch (ActivityNotFoundException e) { Toast.makeText(this, "No app found to open this file", Toast.LENGTH_LONG).show(); }
                })
                .setNeutralButton("Share", (d, w) -> {
                    Intent s = new Intent(Intent.ACTION_SEND);
                    s.setType(mime);
                    s.putExtra(Intent.EXTRA_STREAM, uri);
                    s.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    startActivity(Intent.createChooser(s, "Share " + name));
                })
                .setNegativeButton("Close", null)
                .show();
    }

    private void enqueueDownload(String url, String name, String mime, String userAgent) {
        try {
            DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null) r.addRequestHeader("Cookie", cookies);
            if (userAgent != null) r.addRequestHeader("User-Agent", userAgent);
            if (mime != null) r.setMimeType(mime);
            String fname = cleanName(name, mime);
            r.setTitle(fname);
            r.setDescription("DesignStager");
            r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "DesignStager/" + fname);
            ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(r);
            Toast.makeText(this, "Downloading " + fname + "…", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            // fall back to the phone's browser
            try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); } catch (Exception ignored) { }
        }
    }

    private String readAsset(String path) {
        try (InputStream is = getAssets().open(path); ByteArrayOutputStream bo = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192]; int n;
            while ((n = is.read(buf)) > 0) bo.write(buf, 0, n);
            return bo.toString(StandardCharsets.UTF_8.name());
        } catch (Exception e) { return ""; }
    }

    private static String jsString(String s) {
        return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'";
    }
}
