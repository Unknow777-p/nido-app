package com.nido.app

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class BlockActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try { startLockTask() } catch (_: Throwable) { }

        val msg = intent.getStringExtra("msg") ?: "Tiempo de pantalla agotado"

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(48, 48, 48, 48)
            setBackgroundColor(0xFF1E4F40.toInt())
        }

        val title = TextView(this).apply {
            text = "⛔"
            textSize = 64f
            gravity = Gravity.CENTER
        }

        val message = TextView(this).apply {
            text = msg
            setTextColor(0xFFF3EFE6.toInt())
            textSize = 20f
            gravity = Gravity.CENTER
        }

        val timeUsed = TextView(this).apply {
            text = "Cargando tiempo usado..."
            setTextColor(0xFFF3EFE6.toInt())
            textSize = 16f
            gravity = Gravity.CENTER
            setPadding(0, 16, 0, 0)
        }

        val requestBtn = Button(this).apply {
            text = "Pedir más tiempo"
            setTextColor(0xFF1E4F40.toInt())
            setBackgroundColor(0xFFF3EFE6.toInt())
            setOnClickListener {
                // abrir la app principal para que el niño pueda solicitar tiempo
                val i = Intent(this@BlockActivity, MainActivity::class.java)
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                startActivity(i)
                try { stopLockTask() } catch (_: Throwable) { }
                finish()
            }
        }

        root.addView(title)
        root.addView(message)
        root.addView(timeUsed)
        root.addView(requestBtn)

        setContentView(root)

        // consultar tiempo usado hoy
        Thread {
            runCatching {
                val token = Prefs.token(applicationContext) ?: return@runCatching
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
                val used = child.get("usedTodaySeconds").asLong / 60
                val limit = child.get("limitTodayMinutes").asInt
                runOnUiThread {
                    timeUsed.text = "Tiempo usado hoy: ${used} / ${limit} min"
                }
            }
        }.start()
    }

    override fun onBackPressed() {
        // No permitir salir con atrás.
    }
}
