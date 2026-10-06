package com.nido.app

import android.content.Context

object Prefs {
    private const val FILE = "nido"
    private const val K_URL = "baseUrl"
    private const val K_TOKEN = "token"
    private const val K_LOCKED = "locked"
    private const val K_BLOCKED_APPS = "blockedApps"

    private fun sp(ctx: Context) = ctx.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    fun baseUrl(ctx: Context): String = sp(ctx).getString(K_URL, "https://nido-app-k7fl.onrender.com")!!
    fun saveBaseUrl(ctx: Context, v: String) = sp(ctx).edit().putString(K_URL, v).apply()

    fun token(ctx: Context): String? = sp(ctx).getString(K_TOKEN, null)
    fun saveToken(ctx: Context, v: String) = sp(ctx).edit().putString(K_TOKEN, v).apply()

    fun locked(ctx: Context): Boolean = sp(ctx).getBoolean(K_LOCKED, false)
    fun saveLocked(ctx: Context, v: Boolean) = sp(ctx).edit().putBoolean(K_LOCKED, v).apply()

    fun blockedApps(ctx: Context): Set<String> =
        sp(ctx).getStringSet(K_BLOCKED_APPS, emptySet()) ?: emptySet()

    fun saveBlockedApps(ctx: Context, v: Set<String>) = sp(ctx).edit().putStringSet(K_BLOCKED_APPS, v).apply()
}
