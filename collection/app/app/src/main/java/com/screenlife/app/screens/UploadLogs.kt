package com.screenlife.capture.app.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.screenlife.capture.app.common.LocalData
import com.screenlife.capture.app.common.UploadLog
import kotlinx.serialization.Serializable
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Serializable
object UploadLogsScreenRoute
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UploadLogsScreen(navController: NavController) {

    var logEntries by remember { mutableStateOf<List<UploadLog>>(emptyList()) }
    var selectedLog by remember { mutableStateOf<UploadLog?>(null) }
    val context = LocalContext.current

    fun reload() {
        logEntries = LocalData.getLogEntries(context)?.sortedByDescending { it.timestamp } ?: emptyList()
    }

    fun showResetConfirmationDialog() {
        val builder = android.app.AlertDialog.Builder(context)
        builder.setTitle("Confirm Clear Logs")
        builder.setMessage("Are you sure you want to clear all upload logs?")

        // "Continue" button
        builder.setPositiveButton("Continue") { dialog, _ ->
            LocalData.clearLogEntries(context)
            reload()
            dialog.dismiss()
        }

        // "Cancel" button
        builder.setNegativeButton("Cancel") { dialog, _ ->
            dialog.cancel()
        }

        // Show the dialog
        builder.create().show()
    }

    LaunchedEffect(key1 = Unit) {
        reload()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Upload Logs") },
                actions = {
                    IconButton(onClick = {
                        showResetConfirmationDialog()
                    }) {
                        Icon(
                            imageVector = Icons.Filled.Delete,
                            contentDescription = "Clear Logs"
                        )
                    }
                    IconButton(onClick = {
                        reload()
                        Toast.makeText(context, "Reloaded!", Toast.LENGTH_SHORT).show()
                    }) {
                        Icon(
                            imageVector = Icons.Filled.Refresh,
                            contentDescription = "Reload"
                        )
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(modifier = Modifier
            .padding(innerPadding)
            .padding(horizontal = 16.dp)) {
            if (logEntries.isEmpty()) {
                Text(text = "No upload logs", color = Color.DarkGray)
            }
            LazyColumn {
                items(items= logEntries, itemContent = { log ->
                    LogRow(log = log, onRowClick = { selectedLog = it })
                })
            }
        }

        selectedLog?.let { log ->
            AlertDialog(
                onDismissRequest = { selectedLog = null },
                title = { Text("Details") },
                text = { Text(log.details ?: "No details") },
                confirmButton = {
                    Button(onClick = { selectedLog = null }) {
                        Text("OK")
                    }
                }
            )
        }
    }
}

@Composable
fun LogRow(log: UploadLog, onRowClick: (UploadLog) -> Unit) {
    val epochTime = log.timestamp.toLong()
    val formattedDate = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date(epochTime * 1000))
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { onRowClick(log) }
            .padding(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(
            modifier = Modifier.weight(1f)
        ) {
            Text(
                text = formattedDate,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = log.details ?: "No details",
                color = Color.Gray,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
        Box(
            modifier = Modifier
                .size(24.dp)
                .background(
                    color = if (log.success) Color(0xFF4CAF50) else Color(0xFFE57373),
                    shape = CircleShape
                )
        ) {
            Icon(
                imageVector = if (log.success) Icons.Filled.Check else Icons.Filled.Close,
                contentDescription = if (log.success) "Success" else "Failed",
                tint = Color.White,
                modifier = Modifier.padding(4.dp)
            )
        }
    }
}
