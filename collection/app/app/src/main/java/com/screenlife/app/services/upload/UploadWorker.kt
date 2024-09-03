package com.screenlife.app.services.upload

import android.content.Context
import android.os.Build
import android.util.Log
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.screenlife.app.common.Api
import com.screenlife.app.common.Encryption.getMd5ChecksumBase64
import com.screenlife.app.common.LocalData
import com.screenlife.app.common.Naming
import com.screenlife.app.common.UploadLog
import com.screenlife.app.common.WiFi
import com.screenlife.app.services.capture.ScreenCaptureService
import kotlinx.coroutines.runBlocking
import java.io.BufferedInputStream
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileFilter
import java.io.FileInputStream
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.time.Instant
import java.util.Date
import java.util.Locale
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class UploadWorker(appContext: Context, workerParams: WorkerParameters) :
    Worker(appContext, workerParams) {
    companion object {
        fun getZipsPath(context: Context): String {
            val path = context.getExternalFilesDir(null)
            return "${path?.absolutePath}/zips"
        }
    }

    private fun zipFiles(files: List<File>, zipFile: File) {
        ZipOutputStream(BufferedOutputStream(FileOutputStream(zipFile))).use { zos ->
            files.forEach { file ->
                FileInputStream(file).use { fis ->
                    BufferedInputStream(fis).use { bis ->
                        val entry = ZipEntry(file.name)
                        zos.putNextEntry(entry)
                        bis.copyTo(zos, 1024)
                    }
                }
            }
        }
    }

    private val dateFormat = SimpleDateFormat("yyyyMMdd-HHmmss-SSSSSS", Locale.US)
    private val fileFilter = FileFilter { file ->
        // Extract the date and time part from the file name
        val parts = file.name.split("_")
        if (parts.size < 2) {
            // The file name doesn't match the expected format
            false
        } else {
            try {
                // Parse the date and time from the file name
                val date = dateFormat.parse(parts[1])
                // Check if the file date is before the current time
                date.before(Date())
            } catch (e: Exception) {
                // If parsing fails, consider the file name as invalid
                false
            }
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    override fun doWork(): Result {
        fun showMessage(message: String) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                applicationContext.mainExecutor.execute {
                    Toast.makeText(
                        applicationContext,
                        message,
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
        }

        try {
            val onWifi = WiFi.isWifiConnected(applicationContext)
            if (!onWifi) {
                throw Exception("Not on WiFi")
            }

            val startTime = System.currentTimeMillis()
            val path = ScreenCaptureService.getEncryptedImagesPath(applicationContext)
            val directory = File(path)

            val zipPath = getZipsPath(applicationContext)
            val zipDir = File(zipPath)
            if (!zipDir.exists()) zipDir.mkdirs()

            val zipName = Naming.generateZipName(participantId = "")
            val zipFile = File("${zipPath}/${zipName}.zip")

            // Obtain list of files to be uploaded
            val maxUploadNumber = 1000
            val files = directory.listFiles()?.take(maxUploadNumber) ?: arrayListOf()

            println("Found ${files.size} to upload")

            if (files.isEmpty()) return Result.success()
            zipFiles(files.filterNotNull(), zipFile)
            println("Zip size ${zipFile.length()} bytes")

            val zipTime = System.currentTimeMillis() - startTime

            val data = LocalData.getData(applicationContext)

            val submitManifestUrl = "${data.apiUrl}/submitManifest"
            val checkManifestUrl = "${data.apiUrl}/checkManifest"

            val hash =
                getMd5ChecksumBase64(zipFile) ?: throw Exception("Error while generating MD5")

            runBlocking {
                // Submit a manifest to indicate that we are trying to send a set of images
                val submitManifestResult =
                    Api.submitManifest(submitManifestUrl, data.participantId, data.projectId, hash, files.size)
                println("Details ${data.participantId} ${data.projectId} ${submitManifestResult.manifestId}")
                val signedUploadUrl = submitManifestResult.url
                val manifestId = submitManifestResult.manifestId

                val startTime = System.currentTimeMillis()
                // Upload the zip file containing the data to the signed URL of the Google Cloud Bucket
                Api.uploadZip(signedUploadUrl, zipFile)
                val uploadTime = System.currentTimeMillis() - startTime

                // Check if zip file uploaded successfully
                val response = Api.checkManifest(
                    checkManifestUrl,
                    data.participantId,
                    data.projectId,
                    manifestId
                )

                // If successfully uploaded, delete local copy of images and zip file
                if (response.status != "finished") {
                    throw Exception(response.message)
                }

                files.forEach { it.delete() }
                zipFile.delete()

                showMessage("Uploaded ${files.size} images")

                val entry = UploadLog(
                    Instant.now().epochSecond.toInt(),
                    true,
                    "${files.size} images, zipped in ${zipTime / 1000}s, uploaded in ${uploadTime / 1000}s"
                )
                LocalData.addLogEntry(applicationContext, entry)

                // If there are still files to upload, schedule another UPLOAD work
                if ((directory.listFiles()?.size ?: 0) > 0) {
                    println("Scheduling next UPLOAD")
                    UploadScheduler.scheduleNext(applicationContext)
                }

                return@runBlocking true
            }

            return Result.success()

        } catch (e: Exception) {
            val entry = UploadLog(Instant.now().epochSecond.toInt(), false, e.message)
            LocalData.addLogEntry(applicationContext, entry)
            showMessage("Upload Failed!")
            Log.e("UPLOAD", e.message ?: "")
        }

        return Result.failure()
    }
}
