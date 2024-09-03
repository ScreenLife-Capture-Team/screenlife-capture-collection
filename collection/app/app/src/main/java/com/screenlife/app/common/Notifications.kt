package com.screenlife.app.common

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.screenlife.app.MainActivity
import com.screenlife.app.R

class Notifications {
    companion object {

        private const val CAPTURE_NOTIFICATION_ID = 1
        private const val CAPTURE_CHANNEL_ID = "capture"
        private const val CAPTURE_CHANNEL_NAME = "Screen Capture Service Channel"

        private fun createCaptureNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val importance = NotificationManager.IMPORTANCE_DEFAULT

                val channel = NotificationChannel(CAPTURE_CHANNEL_ID, CAPTURE_CHANNEL_NAME, importance)
                val notificationManager =
                    context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                notificationManager.createNotificationChannel(channel)
            }
        }

        fun sendCaptureStoppedPushNotification(context: Context) {

            this.createCaptureNotificationChannel(context)

            // Build the notification
            val notificationIntent = Intent(context, MainActivity::class.java)
            val pendingIntent = PendingIntent.getActivity(context, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

            val notification = NotificationCompat.Builder(context, CAPTURE_CHANNEL_ID)
                .setContentTitle("ScreenLife NOT Capturing")
                .setContentText("Please remember to enable capture")
                .setSmallIcon(R.drawable.ic_stat_name) // Use your app's icon
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .build()

            // Show the notification
            with(NotificationManagerCompat.from(context)) {
                if (ActivityCompat.checkSelfPermission(
                        context,
                        Manifest.permission.POST_NOTIFICATIONS
                    ) != PackageManager.PERMISSION_GRANTED
                ) {
                    println("No permission to push notification")
                    return
                }
                notify(CAPTURE_NOTIFICATION_ID, notification)
            }
        }
    }

}