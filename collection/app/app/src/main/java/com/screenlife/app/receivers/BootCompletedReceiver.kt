package com.screenlife.capture.app.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.screenlife.capture.app.common.LocalData
import com.screenlife.capture.app.common.Notifications

class BootCompletedReceiver : BroadcastReceiver() {


    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            Log.d("BootCompletedReceiver", "Device Booted")

            if (LocalData.getShouldBeCapturing(context))
                Notifications.sendCaptureStoppedPushNotification(context)
        }
    }
}
