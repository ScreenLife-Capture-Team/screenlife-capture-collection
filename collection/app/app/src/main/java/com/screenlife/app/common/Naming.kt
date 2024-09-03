package com.screenlife.app.common

import android.os.Build
import androidx.annotation.RequiresApi
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

class Naming {
    companion object {
        @RequiresApi(Build.VERSION_CODES.O)
        fun generateImageName(participantId: String): String {
            val date = DateTimeFormatter
                .ofPattern("yyyyMMdd-HHmmss-SSSSSS")
                .withZone(ZoneOffset.UTC)
                .format(Instant.now())
            return "${participantId}_${date}"
        }

        @RequiresApi(Build.VERSION_CODES.O)
        fun generateZipName(participantId: String): String {
            val date = DateTimeFormatter
                .ofPattern("yyyyMMdd-HHmmss-SSSSSS")
                .withZone(ZoneOffset.UTC)
                .format(Instant.now())
            return "${participantId}_${date}.zip"
        }
    }
}