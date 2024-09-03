package com.screenlife.app.screens

import MediaProjectionComponent
import UploadComponent
import android.app.AlertDialog
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.navigation.NavController
import com.screenlife.app.services.upload.UploadScheduler
import com.screenlife.app.common.LocalData
import com.screenlife.app.ui.theme.ScreenLifeTheme
import kotlinx.serialization.Serializable

@Serializable
object HomeScreenRoute
@OptIn(ExperimentalMaterial3Api::class)
@RequiresApi(Build.VERSION_CODES.O)
@Composable
fun HomeScreen(navController: NavController) {

    val lifecycleOwner = LocalLifecycleOwner.current
    val context = LocalContext.current

    var registered by remember {
        mutableStateOf(false)
    }

    LaunchedEffect(key1 = Unit) {
        UploadScheduler.scheduleDailyUploadTrigger(context)
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                // Run your side effect here
                println("Activity is focused")
                registered = LocalData.getRegistered(context)
            }
        }

        lifecycleOwner.lifecycle.addObserver(observer)

        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

     fun hasUsageStatsPermission(): Boolean {
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()
        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 1000 * 60 * 60, now)
        return stats != null && stats.isNotEmpty()
    }

    fun getParticipantId(): String {
        val data = LocalData.getData(context)
        return data.participantId
    }

    fun showResetConfirmationDialog() {
        val builder = AlertDialog.Builder(context)
        builder.setTitle("Confirm Reset")
        builder.setMessage("Are you sure you want to rest your participant profile?")

        // "Continue" button
        builder.setPositiveButton("Continue") { dialog, _ ->
            LocalData.reset(context)
            registered = false
            dialog.dismiss()
        }

        // "Cancel" button
        builder.setNegativeButton("Cancel") { dialog, _ ->
            dialog.cancel()
        }

        // Show the dialog
        builder.create().show()
    }

    ScreenLifeTheme {
        Scaffold (topBar = { TopAppBar(title = { Text("ScreenLife Capture")}) }) { it ->
            Column (modifier = Modifier
                .padding(it)) {

                Card(modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp)) {
                    Column(modifier = Modifier
                        .padding(8.dp)
                        .fillMaxWidth()) {
                        Box(modifier = Modifier.align(Alignment.Start)) {
                            Text(fontWeight=FontWeight.SemiBold, fontSize = 18.sp, text = if (registered) "Participant: ${getParticipantId()}" else "Registration Status: $registered")
                        }
                        Box(modifier = Modifier.align(Alignment.End)) {
                            Row(modifier = Modifier) {
//                                TextButton( onClick = {
//                                    navController.navigate(ManualRegistrationScreenRoute)
//                                }) {
//                                    Text(text = "Manual Registration")
//                                }
                                if (registered) {
                                    TextButton(onClick = {
                                        showResetConfirmationDialog()
                                    }) {
                                        Text(text = "Reset")
                                    }
                                } else {
                                    Button(onClick = {
                                        navController.navigate(QrRegistrationScreenRoute)
                                    }) {
                                        Text(text = "Scan QR")
                                    }
                                }
                            }

                        }
                    }

                }

                MediaProjectionComponent(navController, disabled=!registered)
                UploadComponent(navController, disabled=!registered)

            }
        }

    }
}