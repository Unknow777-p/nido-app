package com.nido.app

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class BlockActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        isTaskRoot
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = android.view.Gravity.CENTER
            setPadding(48, 48, 48, 48)
            setBackgroundColor(0xFF1E4F40.toInt())
        }
        val icon = TextView(this).apply { text = "⛔"; textSize = 64f; gravity = android.view.Gravity.CENTER }
        val msg = TextView(this).apply {
            text = intent.getStringExtra("msg") ?: "Tiempo de pantalla agotado"
            setTextColor(0xFFF3EFE6.toInt())
            textSize = 20f
            gravity = android.view.Gravity.CENTER
        }
        val close = Button(this).apply {
            text = "Ir al inicio"
            setOnClickListener {
                val i = Intent(Intent.ACTION_MAIN)
                i.addCategory(Intent.CATEGORY_HOME)
                i.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                startActivity(i)
                finish()
            }
        }
        root.addView(icon)
        root.addView(msg)
        root.addView(close)
        setContentView(root)
    }

    override fun onBackPressed() {
        // No se puede salir con atrás.
    }
}
