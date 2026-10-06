package com.nido.app

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.view.Gravity
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : Activity() {

    private val WEB_URL = "http://192.168.18.13:5175"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(48, 96, 48, 48)
        }

        val title = TextView(this).apply {
            text = "Nido"
            textSize = 36f
            setTextColor(0xFF1E4F40.toInt())
            gravity = Gravity.CENTER
        }
        val subtitle = TextView(this).apply {
            text = "¿Cómo vas a usar Nido?"
            textSize = 16f
            gravity = Gravity.CENTER
            setPadding(0, 12, 0, 48)
        }
        val tutorBtn = Button(this).apply {
            text = "Soy tutor / padre"
            setTextColor(0xFFF3EFE6.toInt())
            setBackgroundColor(0xFF1E4F40.toInt())
            setOnClickListener {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(WEB_URL)))
            }
        }
        val childBtn = Button(this).apply {
            text = "Soy niño / estudiante"
            setTextColor(0xFFF3EFE6.toInt())
            setBackgroundColor(0xFF1E4F40.toInt())
            setOnClickListener { showPairing() }
        }

        root.addView(title)
        root.addView(subtitle)
        root.addView(tutorBtn)
        root.addView(childBtn)

        val scroll = ScrollView(this).apply {
            addView(root)
            setBackgroundColor(0xFFF3EFE6.toInt())
        }
        setContentView(scroll)
    }

    private fun showPairing() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 64, 48, 48)
            setBackgroundColor(0xFFF3EFE6.toInt())
        }
        val backBtn = TextView(this).apply {
            text = "← Volver"
            textSize = 16f
            setTextColor(0xFF1E4F40.toInt())
            setOnClickListener { recreate() }
        }
        val title = TextView(this).apply {
            text = "Vincular este dispositivo"
            textSize = 22f
            setTextColor(0xFF1E4F40.toInt())
            setPadding(0, 16, 0, 8)
        }
        val hint = TextView(this).apply {
            text = "Pedile al tutor el código de vinculación (en su perfil → Dispositivo → Generar código)."
            setPadding(0, 0, 0, 16)
        }
        val codeInput = EditText(this).apply { hint = "Código, ej. XB7K2P" }
        val status = TextView(this).apply {
            text = if (Prefs.token(this@MainActivity) != null) "Dispositivo vinculado ✅" else "Sin vincular"
            setPadding(0, 16, 0, 0)
        }
        val pairBtn = Button(this).apply {
            text = "Vincular"
            setOnClickListener {
                val code = codeInput.text.toString().trim()
                if (code.isBlank()) { Toast.makeText(this@MainActivity, "Escribe el código", Toast.LENGTH_SHORT).show(); return@setOnClickListener }
                Thread {
                    runCatching {
                        val now = Date()
                        val data = JSONObject()
                            .put("code", code)
                            .put("deviceName", android.os.Build.MODEL)
                            .put("localDate", SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now))
                            .put("localMinutes", now.hours * 60 + now.minutes)
                        NidoApi.call(
                            Prefs.baseUrl(applicationContext), "pairDevice",
                            com.google.gson.JsonParser.parseString(data.toString()).asJsonObject
                        )
                    }.onSuccess {
                        val token = it.asJsonObject.get("token").asString
                        Prefs.saveToken(applicationContext, token)
                        runOnUiThread { status.text = "Dispositivo vinculado ✅"; Toast.makeText(this@MainActivity, "¡Listo!", Toast.LENGTH_SHORT).show() }
                    }.onFailure {
                        runOnUiThread { Toast.makeText(this@MainActivity, it.message ?: "Error", Toast.LENGTH_LONG).show() }
                    }
                }.start()
            }
        }
        val accessBtn = Button(this).apply {
            text = "Activar bloqueo (accesibilidad)"
            setOnClickListener {
                startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
            }
        }
        root.addView(backBtn)
        root.addView(title)
        root.addView(hint)
        root.addView(codeInput)
        root.addView(pairBtn)
        root.addView(status)
        root.addView(accessBtn)
        val scroll = ScrollView(this).apply {
            addView(root)
            setBackgroundColor(0xFFF3EFE6.toInt())
        }
        setContentView(scroll)
    }
}
