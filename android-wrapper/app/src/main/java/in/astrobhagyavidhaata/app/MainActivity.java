package in.astrobhagyavidhaata.app;

import android.app.Activity;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Parcel;
import android.util.Base64;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.KeyEvent;

public class MainActivity extends Activity {
    private static final String STATE_PREFS = "astro_webview_state";
    private static final String STATE_KEY = "last_webview_state";
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        createWebView();

        boolean restored = false;
        if (savedInstanceState != null) {
            restored = webView.restoreState(savedInstanceState) != null;
        }
        if (!restored) {
            restored = restorePersistentWebViewState();
        }
        if (!restored) {
            webView.loadUrl("https://astrobhagyavidhaata.in");
        }
    }

    private void createWebView() {
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(webView);
    }

    private void savePersistentWebViewState() {
        if (webView == null) return;
        Bundle state = new Bundle();
        if (webView.saveState(state) == null) return;

        Parcel parcel = Parcel.obtain();
        try {
            parcel.writeBundle(state);
            String encoded = Base64.encodeToString(parcel.marshall(), Base64.NO_WRAP);
            getSharedPreferences(STATE_PREFS, MODE_PRIVATE)
                    .edit()
                    .putString(STATE_KEY, encoded)
                    .apply();
        } finally {
            parcel.recycle();
        }
    }

    private boolean restorePersistentWebViewState() {
        String encoded = getSharedPreferences(STATE_PREFS, MODE_PRIVATE)
                .getString(STATE_KEY, null);
        if (encoded == null || encoded.isEmpty()) return false;

        Parcel parcel = Parcel.obtain();
        try {
            byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
            parcel.unmarshall(bytes, 0, bytes.length);
            parcel.setDataPosition(0);
            Bundle state = parcel.readBundle(getClassLoader());
            return state != null && webView.restoreState(state) != null;
        } catch (RuntimeException error) {
            getSharedPreferences(STATE_PREFS, MODE_PRIVATE)
                    .edit()
                    .remove(STATE_KEY)
                    .apply();
            return false;
        } finally {
            parcel.recycle();
        }
    }

    @Override
    protected void onPause() {
        savePersistentWebViewState();
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        savePersistentWebViewState();
        super.onSaveInstanceState(outState);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView != null && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
