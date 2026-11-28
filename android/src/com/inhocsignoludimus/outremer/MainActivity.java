package com.inhocsignoludimus.outremer;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * WebView host for Outremer Dawn.
 *
 * The 2.4-dawn-2 build loaded https://appassets.androidplatform.net/assets/www/
 * and tried to intercept with a hand-written smali shouldInterceptRequest.
 * Those null/false branches used if-nez where if-eqz was required, so every
 * real request fell through to the network. The dummy host serves nothing:
 * black screen + the Android broken-image icon (the splash &lt;img&gt;).
 *
 * This shell goes back to the known-good file:///android_asset/www/index.html
 * path (same as the Ludimus APK). Painted lote assets work on a null origin
 * because the page inlines meta.json as JS and serves getImageData sources
 * as data: URIs (js/wv_origin.js + js/wv_pix.js).
 */
public class MainActivity extends Activity {
  private WebView web;

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
    web.setWebViewClient(new WebViewClient());
    web.setWebChromeClient(new WebChromeClient());
    setContentView(web);
    web.loadUrl("file:///android_asset/www/index.html");
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
}
