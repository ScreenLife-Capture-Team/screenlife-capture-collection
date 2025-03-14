package com.screenlife.capture.app.screens

import android.graphics.BitmapFactory
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.AlertDialog
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
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.requiredWidth
import androidx.compose.material3.BasicAlertDialog
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.TextButton
import androidx.compose.ui.platform.LocalConfiguration
import androidx.navigation.NavController
import com.screenlife.capture.app.services.capture.ScreenCaptureService
import com.screenlife.capture.app.ui.theme.ScreenLifeTheme
import kotlinx.serialization.Serializable
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Serializable
object ImagesScreenRoute
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImagesScreen(navController: NavController) {

    var imageFiles by remember { mutableStateOf<List<File>>(emptyList()) }
    var latestFiles by remember { mutableStateOf<List<File>>(emptyList()) }
    var selectedImage by remember { mutableStateOf<File?>(null) }

    val context = LocalContext.current
    
    fun reload() {
        val tempPath = ScreenCaptureService.getTempImagesPath(context)
        val tempDir = File(tempPath)
        
        imageFiles = tempDir
            .walk()  // Walks the file tree starting at the directory
            .maxDepth(1) // We only want the files directly in the directory
            .asSequence() // Convert to sequence for lazy evaluation
            .map { it to it.nameWithoutExtension.toLongOrNull() } // Map to a pair of File and epoch time
            .filter { it.second != null } // Filter out null epoch times
            .sortedByDescending { it.second } // Sort by epoch time in descending order
            .map { it.first } // Map back to File
            .toList() // Convert back to a list

        val encryptedPath = ScreenCaptureService.getEncryptedImagesPath(context)
        val encryptedDir = File(encryptedPath)
        
        latestFiles = encryptedDir
            .walk()  // Walks the file tree starting at the directory
            .maxDepth(1) // We only want the files directly in the directory
            .asSequence() // Convert to sequence for lazy evaluation
            .filter { it.isFile }
            .map { it to it.name.split("_")[1].toLongOrNull() } // Map to a pair of File and epoch time
            .filter { it.second != null } // Filter out null epoch times
            .sortedByDescending { it.second } // Sort by epoch time in descending order
            .map { it.first } // Map back to File
            .take(10) // Take the first 10
            .toList() // Convert back to a list
    }

    LaunchedEffect(key1 = Unit) {
        reload()
        // while (true) {
            // delay(5000)
        // }
    }

    ScreenLifeTheme {
        Scaffold ( topBar={ TopAppBar(title = { Text("Troubleshooting")}, actions = { IconButton(onClick = {
            reload()
            Toast.makeText(context, "Reloaded!", Toast.LENGTH_SHORT).show()
        }) {
            Icon(
                imageVector = Icons.Filled.Refresh,
                contentDescription = "Reload"
            )
        } } )
        }) {
            Column (modifier = Modifier.padding(it).padding(horizontal = 16.dp)) {
                Text(text = "Last 5 image previews", fontWeight = FontWeight.Bold)
                LazyRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp)
                        .requiredWidth(LocalConfiguration.current.screenWidthDp.dp),
                    contentPadding = PaddingValues(horizontal = 32.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(imageFiles.size) { index ->
                        val file = imageFiles[index]
                        val bitmap = BitmapFactory.decodeFile(file.absolutePath)
                        Image(
                            bitmap = bitmap.asImageBitmap(),
                            contentDescription = null,
                            modifier = Modifier
                                .height(200.dp)
                                .padding(vertical = 4.dp)
                                .border(1.dp, androidx.compose.ui.graphics.Color.Gray)
                                .clickable { selectedImage = file },
                            contentScale = ContentScale.FillHeight
                        )
                    }
                }

                if (selectedImage != null) {
                    BasicAlertDialog(onDismissRequest = { selectedImage = null },
                        content = {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                val bitmap = BitmapFactory.decodeFile(selectedImage!!.absolutePath)
                                Image(
                                    bitmap = bitmap.asImageBitmap(),
                                    contentDescription = null,
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Fit
                                )
                            }
                        }
                    )
                }

                Text(text = "Last 10 image capture timestamp", fontWeight = FontWeight.Bold, modifier = Modifier.padding(bottom = 4.dp, top = 4.dp))
                latestFiles.forEach { file ->
                    val epochTime = file.name.split("_")[1].toLongOrNull() ?: 0L
                    val formattedDate = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
                        .format(Date(epochTime))

                    Row(
                        modifier = Modifier
                            .padding(vertical = 4.dp)
                            .padding(start = 16.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("•")
                        Text(text = formattedDate)
                    }
                }
            }
        }
    }
}
