package com.nido.app

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    private lateinit var webView: WebView
    private val WEB_URL = "https://nido-app-k7fl.onrender.com"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    // Almacena el token de dispositivo en Prefs para el servicio nativo
                    view?.evaluateJavascript("""
                        setInterval(function() {
                            var t = localStorage.getItem('nido.device.v1');
                            if (t) { Android.setToken(t); }
                        }, 3000);
                    """.trimIndent(), null)
                }
            }
            addJavascriptInterface(Bridge(), "Android")
            loadUrl(WEB_URL)
        }

        val switch = android.widget.Switch(this).apply {
            text = "Bloqueo"
            setPadding(16, 8, 16, 8)
            setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
            }
        }

        val root = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setBackgroundColor(0xFFF3EFE6.toInt())
        }
        root.addView(switch, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        root.addView(webView, android.widget.LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))

        setContentView(root)
    }

    inner class Bridge {
        @JavascriptInterface
        fun setToken(token: String) {
            Prefs.saveToken(applicationContext, token)
        }
    }
}
