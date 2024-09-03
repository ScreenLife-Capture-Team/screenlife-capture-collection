package com.screenlife.app.screens

import MediaProjectionViewModel
import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.navigation.NavController
import com.screenlife.app.ui.theme.ScreenLifeTheme
import kotlinx.serialization.Serializable
import kotlin.math.roundToInt
import androidx.lifecycle.viewmodel.compose.viewModel
import com.screenlife.app.MainActivity
import com.screenlife.app.R
import com.screenlife.app.common.LocalData
import com.screenlife.app.services.capture.ScreenCaptureService

@Serializable
object StopActivityScreenRoute

private const val notificationId = 2
private const val channelId = "reminders"
private const val channelName = "Reminders"
private const val channelDescription = "Reminders including requesting the user to restart the capture service after pausing / rebooting the device."

@SuppressLint("UnusedMaterial3ScaffoldPaddingParameter")
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StopActivityScreen(
    navController: NavController,
    viewModel: MediaProjectionViewModel = viewModel()
) {
    val context = LocalContext.current

    var isReminderEnabled by remember { mutableStateOf(true) }
    var selectedTime by remember { mutableFloatStateOf(5f) }
    var reason by remember { mutableStateOf("") }

    fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_DEFAULT

            val channel = NotificationChannel(channelId, channelName, importance)
            channel.description = channelDescription

            val notificationManager =
                context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun setupNotification() {
        createNotificationChannel()

        // Build the notification
        val notificationIntent = Intent(context, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(context, 0, notificationIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        val notification = NotificationCompat.Builder(context, channelId)
            .setContentTitle("Reminder: ScreenLife is NOT capturing")
            .setContentText("Time to restart capture")
            .setSmallIcon(R.drawable.ic_stat_name) // Use your app's icon
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        Handler(Looper.getMainLooper()).postDelayed({
            // Show the notification
            with(NotificationManagerCompat.from(context)) {
                if (ActivityCompat.checkSelfPermission(
                        context,
                        Manifest.permission.POST_NOTIFICATIONS
                    ) != PackageManager.PERMISSION_GRANTED
                ) {
                    println("No permission to push notification")
                    return@postDelayed
                }

                // Skip if already capturing (based on the last-set state)
                if (LocalData.getShouldBeCapturing(context)) {
                    return@postDelayed
                }
                notify(notificationId, notification)
            }
        }, (selectedTime * 60 * 1000).toLong())
    }

    ScreenLifeTheme {
        Scaffold(topBar = { TopAppBar(title = { Text("Stop Capture") }) }) {
            Column(
                modifier = Modifier
                    .padding(it)
                    .padding(16.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = "Remind me to turn on capture again",
                        modifier = Modifier
                            .weight(1f)
                            .padding(end = 4.dp)
                    )
                    Switch(
                        checked = isReminderEnabled,
                        onCheckedChange = { isReminderEnabled = it }
                    )
                }

                if (isReminderEnabled) {
                    Slider(
                        value = selectedTime,
                        onValueChange = { selectedTime = it },
                        valueRange = 5f..30f,
                        steps = 25, // Optional: to create discrete steps for each minute
                        modifier = Modifier.fillMaxWidth()
                    )
                    Text(text = "Reminder Interval: ${selectedTime.roundToInt()} minutes", Modifier.padding(bottom = 8.dp))
                }

                OutlinedTextField(
                    label = { Text(text = "Reason for stop") },
                    value = reason,
                    onValueChange = { reason = it.toString() },
                    modifier = Modifier.padding(vertical = 4.dp)
                )

                Button(onClick = {
                    LocalData.setShouldBeCapturing(false, context)
                    viewModel.stopProjection()
                    ScreenCaptureService.addTextImage("Stop Reason: $reason", context)
                    if (isReminderEnabled) {
                        setupNotification()
                    }
                    navController.navigate(HomeScreenRoute)
                }, modifier = Modifier.padding(top = 20.dp).fillMaxWidth()) {
                    Text(text = "Stop Activity")
                }

            }
        }

    }
}