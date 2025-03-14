package com.screenlife.capture.app.screens

import MediaProjectionComponent
import UploadComponent
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.navigation.NavController
import com.screenlife.capture.app.R
import com.screenlife.capture.app.services.upload.UploadScheduler
import com.screenlife.capture.app.common.LocalData
import com.screenlife.capture.app.ui.theme.ScreenLifeTheme
import kotlinx.serialization.Serializable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Info

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

    var showInfoDialog by remember { mutableStateOf(false) }
    var showRegistrationDialog by remember { mutableStateOf(false) }
    var showResetDialog by remember { mutableStateOf(false) }

    LaunchedEffect(key1 = Unit) {
        UploadScheduler.scheduleDailyUploadTrigger(context)
        
        // Show app info dialog on first startup
        if (!LocalData.getHasShownAppInfo(context)) {
            showInfoDialog = true
            LocalData.setHasShownAppInfo(context)
        }
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
        showResetDialog = true
    }

    fun showRegistrationConfirmationDialog() {
        showRegistrationDialog = true
    }

    fun showAppInfoDialog() {
        showInfoDialog = true
    }

    if (showInfoDialog) {
        AlertDialog(
            onDismissRequest = { showInfoDialog = false },
            title = { Text(stringResource(R.string.dialog_about_title)) },
            text = { Text(stringResource(R.string.dialog_about_body)) },
            confirmButton = {
                TextButton(onClick = { showInfoDialog = false }) {
                    Text(stringResource(R.string.dialog_common_ok))
                }
            }
        )
    }

    if (showRegistrationDialog) {
        AlertDialog(
            onDismissRequest = { showRegistrationDialog = false },
            title = { Text(stringResource(R.string.dialog_registration_title)) },
            text = { Text(stringResource(R.string.dialog_registration_body)) },
            confirmButton = {
                TextButton(onClick = { 
                    showRegistrationDialog = false
                    navController.navigate(QrRegistrationScreenRoute)
                }) {
                    Text(stringResource(R.string.dialog_common_continue))
                }
            },
            dismissButton = {
                TextButton(onClick = { showRegistrationDialog = false }) {
                    Text(stringResource(R.string.dialog_common_cancel))
                }
            }
        )
    }

    if (showResetDialog) {
        AlertDialog(
            onDismissRequest = { showResetDialog = false },
            title = { Text(stringResource(R.string.dialog_reset_title)) },
            text = { Text(stringResource(R.string.dialog_reset_body)) },
            confirmButton = {
                TextButton(onClick = { 
                    showResetDialog = false
                    LocalData.reset(context)
                    registered = false
                }) {
                    Text(stringResource(R.string.dialog_common_continue))
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetDialog = false }) {
                    Text(stringResource(R.string.dialog_common_cancel))
                }
            }
        )
    }

    ScreenLifeTheme {
        Scaffold (topBar = { 
            TopAppBar(
                title = { Text("ScreenLife Capture") },
                actions = {
                    IconButton(onClick = { showAppInfoDialog() }) {
                        Icon(
                            imageVector = Icons.Outlined.Info,
                            contentDescription = "App Information"
                        )
                    }
                }
            )
        }) { it ->
            Column (modifier = Modifier
                .padding(it)) {

                Card(modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp)) {
                    Column(modifier = Modifier
                        .padding(8.dp)
                        .fillMaxWidth()) {
                        Column(modifier = Modifier.align(Alignment.Start)) {
                            Text(fontWeight=FontWeight.SemiBold, fontSize = 18.sp, text = if (registered) "Participant Registered" else "Participation Status")
                            Text(text = if (registered) "${getParticipantId()}" else "Not Registered")
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
                                        showResetDialog = true
                                    }) {
                                        Text(text = "Reset")
                                    }
                                } else {
                                    Button(onClick = {
                                        showRegistrationDialog = true
                                    }) {
                                        Text(text = "Register")
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