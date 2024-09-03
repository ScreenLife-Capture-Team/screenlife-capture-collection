// MediaProjectionComponent.kt
import android.Manifest
import android.app.AlertDialog
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresApi
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.runtime.livedata.observeAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.core.content.PermissionChecker
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.screenlife.app.common.LocalData
import com.screenlife.app.screens.ImagesScreenRoute
import com.screenlife.app.screens.StopActivityScreenRoute
import com.screenlife.app.services.capture.ScreenCaptureService
import com.screenlife.app.services.capture.ScreenCaptureService.Companion.hasUsageStatsPermission
import kotlinx.coroutines.delay
import java.io.File

@RequiresApi(Build.VERSION_CODES.O)
@Composable
fun MediaProjectionComponent(
    navController: NavController,
    disabled: Boolean = false,
    viewModel: MediaProjectionViewModel = viewModel()
) {
    val projectionStatus by viewModel.projectionStatus.observeAsState(initial = false)

    // Launcher for Activity Result
    val launcher =
        rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            viewModel.handleActivityResult(result.resultCode, result.data)
        }

    var loading by remember { mutableStateOf(true) }
    var numImages by remember { mutableIntStateOf(0) }

    val context = LocalContext.current

    fun hasNotificationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context, Manifest.permission.POST_NOTIFICATIONS
        ) == PermissionChecker.PERMISSION_GRANTED

    }

    LaunchedEffect(key1 = Unit) {
        val encryptedPath = ScreenCaptureService.getEncryptedImagesPath(context)
        val directory = File(encryptedPath)
        if (!directory.exists()) {
            directory.mkdirs()
        }

        while (true) {
            if (!directory.exists()) {
                println("The provided path is not a directory or does not exist.")
                println("path $encryptedPath")
                continue
            }

            val files = directory.listFiles()
            if (files != null && files.isNotEmpty()) {
                val newNumImages = files.count { it.isFile }
                if (numImages != 0 && loading) {
                    if (numImages != newNumImages) {
                        viewModel.manuallyUpdateProjectionStatus(true)
                        LocalData.setShouldBeCapturing(true, context)
                    } else {
                        LocalData.setShouldBeCapturing(false, context)
                    }
                    loading = false
                }

                if (numImages != newNumImages) {
                    numImages = newNumImages
                }
            } else {
                loading = false
                LocalData.setShouldBeCapturing(false, context)
            }
            delay(5000)
        }
    }

    fun showUsageAccessDialog(context: Context) {
        val builder = AlertDialog.Builder(context)
        builder.setMessage("Please allow ScreenLife 'Usage Access' permission to proceed")
            .setTitle("Permission Required")
        builder.setPositiveButton("OK") { dialog, _ ->
            context.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
            dialog.dismiss()
        }
        builder.setNegativeButton("Cancel") { dialog, _ ->
            dialog.dismiss()
        }
        val dialog = builder.create()
        dialog.show()
    }

    fun showNotificationPermissionDialog(context: Context) {
        val builder = AlertDialog.Builder(context)
        builder.setMessage("Please allow ScreenLife 'Notifications' permission to proceed")
            .setTitle("Permission Required")
        builder.setPositiveButton("OK") { dialog, _ ->
            val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                data = Uri.fromParts("package", context.packageName, null)
            }
            context.startActivity(intent)
            dialog.dismiss()
        }
        builder.setNegativeButton("Cancel") { dialog, _ ->
            dialog.dismiss()
        }
        val dialog = builder.create()
        dialog.show()
    }

    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) showNotificationPermissionDialog(context)
    }

    fun startProjection() {
        if (!hasNotificationPermission()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                Toast.makeText(context, "Please grant ScreenLife Capture permission to show Notificatinos", Toast.LENGTH_SHORT)
                    .show()
            }
            return
        }
        if (!hasUsageStatsPermission(context)) {
            showUsageAccessDialog(context)
        } else {
            val mediaProjectionManager =
                context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
            val intent = mediaProjectionManager.createScreenCaptureIntent()
            launcher.launch(intent)

            LocalData.setShouldBeCapturing(true, context)
        }
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp)
            .alpha(if (disabled) 0.5f else 1f)
    ) {
        Column(
            modifier = Modifier
                .padding(8.dp)
                .fillMaxWidth()
        ) {
            Column(modifier = Modifier.align(Alignment.Start)) {
                Text(
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 18.sp,
                    text = if (loading) "Projection status is loading" else if (projectionStatus) "Projection is running" else "Projection is stopped"
                )
                Text(text = "$numImages images")
            }
            Box(modifier = Modifier.align(Alignment.End)) {
                Row(modifier = Modifier) {
                    TextButton(
                        onClick = { navController.navigate(ImagesScreenRoute) },
                        enabled = !disabled
                    ) {
                        Text(text = "View")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    if (loading) {
                        Button(onClick = {}, enabled = false) {
                            Text(text = "Loading..")
                        }
                    } else if (projectionStatus) {
                        OutlinedButton(onClick = {
                            navController.navigate(StopActivityScreenRoute)
                        }, enabled = !disabled) {
                            Text(text = "Stop Projection")
                        }
                    } else {
                        Button(onClick = {
                            startProjection()
                        }, enabled = !disabled) {
                            Text(text = "Start Projection")
                        }
                    }
                }
            }
        }
    }
}
