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

        val switch = android.widget.Switch(this).apply {
            text = "Activar Nido en Accesibilidad"
            setPadding(16, 8, 16, 8)
            setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) startActivity(Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS))
            }
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

        val root = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setBackgroundColor(0xFF1E4F40.toInt())
        }
        root.addView(switch, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

        val overlay = FrameLayout(this).apply {
            setBackgroundColor(0xFFF3EFE6.toInt())
        }
        overlay.addView(webView, ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        overlay.addView(lockView, ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

        root.addView(overlay, android.widget.LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))

        setContentView(root)

        // verifica el estado de bloqueo cada 5 segundos via servidor
        Thread {
            while (true) {
                runCatching {
                    val token = Prefs.token(applicationContext)
                    if (token == null) {
                        Prefs.saveLocked(applicationContext, false)
                    } else {
                        val now = java.util.Date()
                        val data = org.json.JSONObject()
                            .put("token", token)
                            .put("localDate", java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.US).format(now))
                            .put("localMinutes", now.hours * 60 + now.minutes)
                        val res = NidoApi.call(
                            Prefs.baseUrl(applicationContext), "deviceSession",
                            com.google.gson.JsonParser.parseString(data.toString()).asJsonObject
                        )
                        val child = res.asJsonObject.getAsJsonObject("session").getAsJsonObject("child")
                        val realLocked = child.get("locked").asBoolean
                        Prefs.saveLocked(applicationContext, realLocked)
                    }
                }
                runOnUiThread {
                    lockView.visibility = if (Prefs.locked(applicationContext)) View.VISIBLE else View.GONE
                }
                try { Thread.sleep(5000) } catch (_: InterruptedException) { break }
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
