package com.screenlife.app.services.capture

// ScreenCaptureService.kt
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import com.screenlife.app.MainActivity
import com.screenlife.app.R
import com.screenlife.app.common.Encryption
import com.screenlife.app.common.LocalData
import com.screenlife.app.common.Notifications
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer

class ScreenCaptureService : Service() {

    companion object {
        const val CHANNEL_ID = "capture"
        const val CHANNEL_NAME = "Screen Capture Service Channel"
        const val NOTIFICATION_ID = 1
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val ACTION_ADD = "ACTION_ADD"
        private var mediaProjectionManager: MediaProjectionManager? = null
        var mediaProjection: MediaProjection? = null
        private var _resultCode: Int? = null
        private var _data: Intent? = null

        @RequiresApi(Build.VERSION_CODES.O)
        fun startService(context: Context, manager: MediaProjectionManager, resultCode: Int, data: Intent) {
            mediaProjectionManager = manager
            _resultCode = resultCode
            _data = data

            val startIntent = Intent(context, ScreenCaptureService::class.java)
            startIntent.action = ACTION_START
            context.startForegroundService(startIntent)
        }

        fun stopService(context: Context) {
            val stopIntent = Intent(context, ScreenCaptureService::class.java)
            stopIntent.action = ACTION_STOP
            context.startService(stopIntent)
        }

        fun addTextImage(text: String, context: Context) {
            val intent = Intent(context, ScreenCaptureService::class.java)
            intent.action = ACTION_ADD
            intent.putExtra("text", text)
            context.startService(intent)
        }

        fun getEncryptedImagesPath(context: Context): String {
            val path = context.getExternalFilesDir(null)
            return "${path?.absolutePath}/encrypted"
        }

        fun getTempImagesPath(context: Context): String {
            val path = context.getExternalFilesDir(null)
            return "${path?.absolutePath}/temp"
        }

        fun hasUsageStatsPermission(context: Context): Boolean {
            val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val now = System.currentTimeMillis()
            val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 1000 * 60 * 60, now)
            return stats != null && stats.isNotEmpty()
        }

    }

    private lateinit var imageReader: ImageReader
    private lateinit var handlerThread: HandlerThread
    private lateinit var handler: Handler

    private var recentStats: UsageStats? = null
    private fun getCurrentApp(): String? {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()
        val stats = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 1000, now)
        println("STATS ${stats.size}")

        if (stats != null) {
            for (usageStats in stats) {
                println("USAGE STATS ${usageStats.packageName}")
                if (recentStats == null || usageStats.lastTimeUsed > recentStats!!.lastTimeUsed) {
                    recentStats = usageStats
                }
            }
            if (recentStats != null) {
                println("RECENT STATS ${recentStats!!.packageName}")
                return recentStats!!.packageName
            }
        }
        return null
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        // Stop the foreground service and remove the notification
        stopForeground(STOP_FOREGROUND_REMOVE)

        // Stop the service
        stopSelf()

        if (LocalData.getShouldBeCapturing(applicationContext))
            Notifications.sendCaptureStoppedPushNotification(applicationContext)

        super.onDestroy()
    }


    @RequiresApi(Build.VERSION_CODES.Q)
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startForegroundService()
            ACTION_STOP -> stopForegroundService()
            ACTION_ADD -> intent.getStringExtra("text")?.let { createTextImage(it) }
        }
        return START_STICKY
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private fun startForegroundService() {
        createNotificationChannel()
        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)

        mediaProjection = mediaProjectionManager?.getMediaProjection(_resultCode!!, _data!!)
        mediaProjection!!.registerCallback(object : MediaProjection.Callback() {
            override fun onStop() {
                // Handle the projection stopping
                //
            }
        }, null)

        Handler().postDelayed({
            startScreenCapture()
        }, 1000)

    }

    private fun stopForegroundService() {
        mediaProjection?.stop()
        handlerThread.quitSafely()
        stopForeground(true)
        stopSelf()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    private fun buildNotification(): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Screen Capture Service")
            .setContentText("Screen capture is running")
            .setSmallIcon(R.drawable.ic_stat_name)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun startScreenCapture() {
        val metrics = resources.displayMetrics
        val width = metrics.widthPixels
        val height = metrics.heightPixels
        val density = metrics.densityDpi

        imageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
        mediaProjection?.createVirtualDisplay(
            "ScreenCapture",
            width,
            height,
            density,
            0,
            imageReader.surface,
            null,
            null
        )

        handlerThread = HandlerThread("ImageReaderHandler")
        handlerThread.start()
        handler = Handler(handlerThread.looper)

        handler.postDelayed(object : Runnable {
            @RequiresApi(Build.VERSION_CODES.O)
            override fun run() {
                captureImage()
                handler.postDelayed(this, 5000) // Capture every 5 seconds
            }
        }, 5000)
    }

    private fun createWrappedTextBitmap(text: String, width: Int, height: Int): Bitmap {
        // Create a bitmap with the specified width and height
        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

        // Create a canvas to draw on the bitmap
        val canvas = Canvas(bitmap)

        // Set the background color to black
        canvas.drawColor(Color.BLACK)

        // Create a TextPaint object to define the text style
        val textPaint = TextPaint().apply {
            color = Color.WHITE // Text color
            textSize = 20f // Text size
            typeface = Typeface.DEFAULT_BOLD // Text style
        }

        // Create a StaticLayout to handle text wrapping
        val staticLayout = StaticLayout.Builder.obtain(text, 0, text.length, textPaint, width)
            .setAlignment(Layout.Alignment.ALIGN_CENTER)
            .setLineSpacing(0f, 1f)
            .setIncludePad(false)
            .build()

        // Calculate the vertical position to draw the text (centered)
        val yPos = (canvas.height - staticLayout.height) / 2f

        // Save the current state of the canvas
        canvas.save()

        // Translate the canvas to the center of the bitmap
        canvas.translate(0f, yPos)

        // Draw the text with wrapping on the canvas
        staticLayout.draw(canvas)

        // Restore the canvas to its original state
        canvas.restore()

        return bitmap
    }

    @RequiresApi(Build.VERSION_CODES.O)
    fun createTextImage(text: String) {
        val bitmap = createWrappedTextBitmap(text, 500, 2000)
        saveEncrypted(bitmap)
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun captureImage() {
        val image: Image = imageReader.acquireLatestImage() ?: return
        val planes = image.planes
        val buffer: ByteBuffer = planes[0].buffer
        val pixelStride = planes[0].pixelStride
        val rowStride = planes[0].rowStride
        val rowPadding = rowStride - pixelStride * imageReader.width

        val bitmap = Bitmap.createBitmap(
            imageReader.width + rowPadding / pixelStride,
            imageReader.height,
            Bitmap.Config.ARGB_8888
        )
        bitmap.copyPixelsFromBuffer(buffer)

        image.close()

        saveEncrypted(bitmap)
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun saveEncrypted(bitmap: Bitmap) {
        val filename = "${System.currentTimeMillis()}"
        val out = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
        val byteArray = out.toByteArray()
        val byteArray2 = byteArray.copyOf()
        val bais = ByteArrayInputStream(byteArray)

        val data = LocalData.getData(applicationContext)
        val key = data.key
        val participantId = data.participantId

        val appName = getCurrentApp() ?: ""
        println("AppName $appName")

        println("Key $key")
        key ?.let {
            Encryption.encryptToFile(bais, Encryption.hexStringToByteArray(key), getEncryptedImagesPath(applicationContext), "${participantId}_${filename}", appName)
        }

        saveTemp(byteArray2,"$filename.png")
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun saveTemp(byteArray: ByteArray, filename: String) {
        val tempPath = getTempImagesPath(applicationContext)

        val directory = File(tempPath)
        if (!directory.exists()) {
            directory.mkdirs()
        }

        cleanUpOldImages(tempPath)
        val path = "$tempPath/$filename"
        println("Saving temp to $path")
        val fos = FileOutputStream(path)
        fos.write(byteArray)
        fos.flush()
    }

    private fun cleanUpOldImages(directoryPath: String) {
        val directory = File(directoryPath)

        // Ensure the directory exists and is a directory
        if (directory.exists() && directory.isDirectory) {
            // Get all files matching the pattern
            val files = directory
                .walk()
                .maxDepth(1) // Only consider files directly within the directory
                .asSequence()
                .filter { it.isFile && it.name.matches(Regex("\\d+\\.png")) }
                .map { it to it.nameWithoutExtension.toLongOrNull() } // Pair file with epoch time
                .filter { it.second != null } // Filter out any files with invalid epoch time
                .sortedByDescending { it.second } // Sort by epoch time in descending order
                .map { it.first } // Map back to File
                .toList()

            println("Found ${files.size} while cleaning")
            // Check if there are more than 4 files
            if (files.size > 4) {
                // Get the files to delete (all but the first 4)
                val filesToDelete = files.drop(4)

                // Delete the files
                filesToDelete.forEach { file ->
                    if (file.delete()) {
                        println("Deleted: ${file.name}")
                    } else {
                        println("Failed to delete: ${file.name}")
                    }
                }
            }
        } else {
            println("Directory does not exist or is not a directory")
        }
    }
}
