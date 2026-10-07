package com.nido.app

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.TextView

class MainActivity : Activity() {

    private lateinit var webView: WebView
    private lateinit var lockView: TextView
    private val WEB_URL = "https://nido-app-k7fl.onrender.com"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
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

        lockView = TextView(this).apply {
            text = "⛔\n\nSe acabó el tiempo de pantalla.\nHabla con tu tutor."
            textSize = 24f
            setTextColor(0xFFF3EFE6.toInt())
            setBackgroundColor(0xFF1E4F40.toInt())
            textAlignment = View.TEXT_ALIGNMENT_CENTER
            visibility = View.GONE
            gravity = android.view.Gravity.CENTER
        }

        val root = FrameLayout(this).apply {
            addView(webView, ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
            addView(lockView, ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        }

        setContentView(root)

        // verifica el estado de bloqueo cada 2 segundos
        Thread {
            while (true) {
                val locked = Prefs.locked(applicationContext)
                runOnUiThread {
                    lockView.visibility = if (locked) View.VISIBLE else View.GONE
                }
                try { Thread.sleep(2000) } catch (_: InterruptedException) { break }
            }
        }.start()
    }

    override fun onBackPressed() {
        if (Prefs.locked(applicationContext)) {
            // no permitir salir
            return
        }
        if (webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }

    inner class Bridge {
        @JavascriptInterface
        fun setToken(token: String) {
            Prefs.saveToken(applicationContext, token)
        }
    }
}
