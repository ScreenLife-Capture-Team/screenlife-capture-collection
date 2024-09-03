// MediaProjectionComponent.kt
import android.os.Build
import android.widget.Toast
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
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.screenlife.app.services.upload.UploadScheduler
import com.screenlife.app.screens.UploadLogsScreenRoute
import kotlinx.coroutines.delay


@RequiresApi(Build.VERSION_CODES.O)
@Composable
fun UploadComponent(navController: NavController, disabled: Boolean = false) {
    val context = LocalContext.current

    var uploading by remember { mutableStateOf(false) }

    LaunchedEffect(key1 = Unit) {
        while (true) {
            uploading = UploadScheduler.isUploadScheduled(context)
            delay(5000)
        }
    }

    Card(modifier = Modifier
        .fillMaxWidth()
        .padding(8.dp)
        .alpha(if (disabled) 0.5f else 1f)) {
        Column(modifier = Modifier
            .padding(8.dp)
            .fillMaxWidth()) {
            Column(modifier = Modifier.align(Alignment.Start)) {
                Text(fontWeight=FontWeight.SemiBold, fontSize = 18.sp, text = "Upload")
            }
            Box(modifier = Modifier.align(Alignment.End)) {
                Row(modifier = Modifier) {
                    TextButton(onClick = { navController.navigate(UploadLogsScreenRoute) }) {
                        Text(text = "Logs")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    TextButton(onClick = {
                        UploadScheduler.cancelRunningUpload(context)
                    }, enabled = uploading) {
                        Text(text = "Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(onClick = {
                        if (UploadScheduler.isUploadScheduled(context)) {
                            Toast.makeText(context, "Already Uploading", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        UploadScheduler.scheduleNext(context)
                        Toast.makeText(context, "Upload started..", Toast.LENGTH_SHORT).show()
                    }, enabled = !disabled && !uploading) {
                        Text(text = if (uploading) "Uploading.." else "Start Upload")
                    }
                }
            }
        }
    }
}
