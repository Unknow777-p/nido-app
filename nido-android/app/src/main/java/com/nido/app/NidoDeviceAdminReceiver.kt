package com.nido.app

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent

class NidoDeviceAdminReceiver : DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        Prefs.saveAdminEnabled(context, true)
    }

    override fun onDisabled(context: Context, intent: Intent) {
        Prefs.saveAdminEnabled(context, false)
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        return "Para desinstalar Nido necesitas el PIN del tutor. Pídeselo antes de continuar."
    }
}
