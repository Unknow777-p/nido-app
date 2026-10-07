package com.nido.app

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class NidoAccessibilityService : AccessibilityService() {

    private var lastRefresh = 0L
    private var lastShowLockScreen = 0L

    override fun onServiceConnected() {
        serviceInfo = serviceInfo.apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED or AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            notificationTimeout = 500
            flags = flags or AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return
        maybeRefresh()

        val pkg = event.packageName?.toString() ?: return
        if (Prefs.locked(applicationContext)) {
            // silencio: mejor mostrarlo dentro de la app Principal
            return
        }
        if (pkg in Prefs.blockedApps(applicationContext)) {
            reportTamper("App bloqueada: $pkg")
            showBlock("Esa app está bloqueada ahora.")
            performGlobalAction(GLOBAL_ACTION_HOME)
            return
        }
        if (isBrowser(pkg)) {
            scanForDisallowedUrl(event.source)
        }
    }

    private fun isBrowser(pkg: String) = pkg in BROWSERS

    private fun scanForDisallowedUrl(root: AccessibilityNodeInfo?) {
        val host = findHostLike(root) ?: return
        val token = Prefs.token(applicationContext) ?: return
        Thread {
            runCatching {
                val url = if (host.startsWith("http://") || host.startsWith("https://")) host else "https://$host"
                val res = NidoApi.call(
                    Prefs.baseUrl(applicationContext), "deviceClassify",
                    JSONObject().put("token", token).put("url", url).let {
                        com.google.gson.JsonParser.parseString(it.toString()).asJsonObject
                    }
                )
                if (!res.asJsonObject.get("allowed").asBoolean) {
                    showBlock("Sitio bloqueado: $host")
                    performGlobalAction(GLOBAL_ACTION_HOME)
                }
            }
        }.start()
    }

    private fun findHostLike(node: AccessibilityNodeInfo?): String? {
        node ?: return null
        val text = node.text?.toString() ?: node.contentDescription?.toString()
        if (text != null && text.contains(".") && !text.contains(" ") && text.length < 120) return text.trim()
        for (i in 0 until node.childCount) {
            findHostLike(node.getChild(i))?.let { return it }
        }
        return null
    }

    private fun maybeRefresh() {
        val nowMs = System.currentTimeMillis()
        if (nowMs - lastRefresh < 30_000L) return
        lastRefresh = nowMs
        val token = Prefs.token(applicationContext) ?: return
        Thread {
            runCatching {
                val now = Date()
                val data = JSONObject()
                    .put("token", token)
                    .put("localDate", SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now))
                    .put("localMinutes", now.hours * 60 + now.minutes)
                val res = NidoApi.call(
                    Prefs.baseUrl(applicationContext), "deviceHeartbeat",
                    com.google.gson.JsonParser.parseString(data.toString()).asJsonObject
                )
                val session = res.asJsonObject.getAsJsonObject("session")
                val child = session.getAsJsonObject("child")
                Prefs.saveLocked(applicationContext, child.get("locked").asBoolean)
                val toggles = session.getAsJsonObject("appToggles")
                val blocked = mutableSetOf<String>()
                if (toggles != null) {
                    for (key in toggles.keySet()) {
                        if (!toggles.get(key).asBoolean) {
                            APP_ID_TO_PACKAGE[key]?.let { blocked.add(it) }
                        }
                    }
                }
                Prefs.saveBlockedApps(applicationContext, blocked)
            }
        }.start()
    }

    private fun reportTamper(detail: String) {
        val token = Prefs.token(applicationContext) ?: return
        Thread {
            runCatching {
                NidoApi.call(
                    Prefs.baseUrl(applicationContext), "deviceReportTamper",
                    JSONObject().put("token", token).put("detail", detail).let {
                        com.google.gson.JsonParser.parseString(it.toString()).asJsonObject
                    }
                )
            }
        }.start()
    }

    private fun showBlock(msg: String) {
        val i = Intent(applicationContext, BlockActivity::class.java)
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        i.putExtra("msg", msg)
        startActivity(i)
    }

    override fun onInterrupt() {}

    companion object {
        private val BROWSERS = setOf(
            "com.android.chrome",
            "com.google.android.apps.chrome",
            "com.microsoft.emmx",
            "org.mozilla.firefox",
            "com.brave.browser",
            "com.opera.browser",
            "com.sec.android.app.sbrowser",
            "com.android.vending"
        )

        // Id de catálogo de Nido → paquete Android
        val APP_ID_TO_PACKAGE = mapOf(
            "youtube" to "com.google.android.youtube",
            "tiktok" to "com.zhiliaoapp.musically",
            "instagram" to "com.instagram.android",
            "snapchat" to "com.snapchat.android",
            "discord" to "com.discord",
            "x" to "com.twitter.android",
            "reddit" to "com.reddit.frontpage",
            "facebook" to "com.facebook.katana",
            "whatsapp" to "com.whatsapp",
            "telegram" to "org.telegram.messenger",
            "telegramx" to "org.thunderdog.challegram",
            "telegramweb" to "org.telegram.messenger.web",
            "twitch" to "tv.twitch.android.app",
            "netflix" to "com.netflix.mediaclient",
            "roblox" to "com.roblox.client",
            "wikipedia" to "org.wikipedia",
            "khan" to "org.khanacademy.android",
            "scratch" to "org.scratch.android",
            "duolingo" to "com.duolingo",
            "youtubekids" to "com.google.android.apps.youtube.kids"
        )
    }
}
