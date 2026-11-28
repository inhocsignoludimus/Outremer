package com.inhocsignoludimus.outremer;

import android.app.Activity;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * WebView host for Outremer Dawn.
 *
 * Painted lote assets need fetch() + getImageData. Under file:///android_asset
 * the page origin is "null", so modern WebView blocks those (same as Chrome
 * without --allow-file-access-from-files) and lote1–5 fall back to the old
 * pixel look. We serve the packed www tree at
 * https://appassets.androidplatform.net/assets/... via shouldInterceptRequest
 * (WebViewAssetLoader-style, no AndroidX).
 */
public class MainActivity extends Activity {
  private WebView web;
  static final String HOST = "appassets.androidplatform.net";
  static final String PREFIX = "/assets/";

  private void immersive() {
    getWindow().getDecorView().setSystemUiVisibility(0x1706);
  }

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    getWindow().addFlags(0x80);
    web = new WebView(this);
    web.setBackgroundColor(0xFF000000);
    WebSettings s = web.getSettings();
    s.setJavaScriptEnabled(true);
    s.setDomStorageEnabled(true);
    s.setDatabaseEnabled(true);
    s.setAllowFileAccess(true);
    s.setAllowFileAccessFromFileURLs(true);
    s.setAllowUniversalAccessFromFileURLs(true);
    s.setMediaPlaybackRequiresUserGesture(false);
    s.setSupportZoom(false);
    s.setUserAgentString(s.getUserAgentString() + " AfterLightApp");
    web.setWebViewClient(new Client(getAssets()));
    web.setWebChromeClient(new WebChromeClient());
    setContentView(web);
    web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");
    immersive();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) immersive();
  }

  @Override
  protected void onPause() {
    super.onPause();
    if (web != null) web.onPause();
  }

  @Override
  protected void onResume() {
    super.onResume();
    if (web != null) web.onResume();
  }

  @Override
  public void onBackPressed() {
    if (web != null) {
      web.evaluateJavascript(
        "document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',keyCode:27,bubbles:true}))",
        null);
    }
  }

  static final class Client extends WebViewClient {
    private final AssetManager am;
    Client(AssetManager am) { this.am = am; }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
      Uri uri = req.getUrl();
      if (uri == null || !HOST.equals(uri.getHost())) {
        return super.shouldInterceptRequest(view, req);
      }
      String path = uri.getPath();
      if (path == null || !path.startsWith(PREFIX)) return notFound();
      String asset = path.substring(PREFIX.length());
      if (asset.length() == 0 || asset.contains("..")) return notFound();
      try {
        InputStream in = am.open(asset);
        String mime = mime(asset);
        Map<String, String> headers = new HashMap<>();
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Cache-Control", "no-store");
        return new WebResourceResponse(mime, enc(mime), 200, "OK", headers, in);
      } catch (Exception e) {
        return notFound();
      }
    }

    static String mime(String path) {
      String p = path.toLowerCase();
      if (p.endsWith(".html") || p.endsWith(".htm")) return "text/html";
      if (p.endsWith(".js")) return "application/javascript";
      if (p.endsWith(".json") || p.endsWith(".map")) return "application/json";
      if (p.endsWith(".css")) return "text/css";
      if (p.endsWith(".png")) return "image/png";
      if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
      if (p.endsWith(".webp")) return "image/webp";
      if (p.endsWith(".gif")) return "image/gif";
      if (p.endsWith(".svg")) return "image/svg+xml";
      if (p.endsWith(".mp3")) return "audio/mpeg";
      if (p.endsWith(".ogg")) return "audio/ogg";
      if (p.endsWith(".wav")) return "audio/wav";
      if (p.endsWith(".woff2")) return "font/woff2";
      if (p.endsWith(".woff")) return "font/woff";
      if (p.endsWith(".ttf")) return "font/ttf";
      if (p.endsWith(".wasm")) return "application/wasm";
      if (p.endsWith(".txt")) return "text/plain";
      if (p.endsWith(".xml")) return "application/xml";
      return "application/octet-stream";
    }

    static String enc(String mime) {
      if (mime.startsWith("text/") || mime.equals("application/javascript")
          || mime.equals("application/json") || mime.equals("image/svg+xml")) {
        return "utf-8";
      }
      return null;
    }

    static WebResourceResponse notFound() {
      Map<String, String> headers = new HashMap<>();
      return new WebResourceResponse(
        "text/plain", "utf-8", 404, "Not Found", headers,
        new ByteArrayInputStream(new byte[0]));
    }
  }
}
