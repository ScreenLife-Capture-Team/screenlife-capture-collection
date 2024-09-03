package com.screenlife.app.common

import android.content.Context
import android.content.SharedPreferences
import com.screenlife.app.services.capture.ScreenCaptureService
import java.io.File
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken


data class UploadLog(
    val timestamp: Int,
    val success: Boolean,
    val details: String? = null
)
fun deleteContent(folder: File): Boolean {
    if (folder.exists()) {
        val files = folder.listFiles()
        if (files != null) {
            for (file in files) {
                if (file.isDirectory) {
                    // Recursively delete the contents of the subfolder
                    deleteContent(file)
                } else {
                    // Delete the file
                    file.delete()
                }
            }
        }
    }
    return false
}
class LocalData {
    data class LocalDataElements(val participantId: String, val projectId: String, val apiUrl: String, val key: String)
    companion object {
        fun getData(context: Context): LocalDataElements {
            val sharedPreferences = context.getSharedPreferences("default", Context.MODE_PRIVATE)

            val participantId = sharedPreferences.getString("participantId", "")
            val projectId = sharedPreferences.getString("projectId", "")
            val apiUrl = sharedPreferences.getString("apiUrl", "")
            val key = sharedPreferences.getString("key", "")

            if (participantId == null || participantId == "" || projectId == null || projectId == "" || apiUrl == null || apiUrl == "" || key == null || key == "") {
                throw Exception("Empty required local shared preference")
            }

            return LocalDataElements(participantId, projectId, apiUrl, key)
        }

        fun getRegistered(context: Context): Boolean {
            val sharedPreferences = context.getSharedPreferences("default", Context.MODE_PRIVATE)

            val participantId = sharedPreferences.getString("participantId", "")
            val projectId = sharedPreferences.getString("projectId", "")
            val apiUrl = sharedPreferences.getString("apiUrl", "")
            val key = sharedPreferences.getString("key", "")

            if (participantId == null || participantId == "" || projectId == null || projectId == "" || apiUrl == null || apiUrl == "" || key == null || key == "") {
                return false
            }

            return true
        }

        fun addLogEntry(context: Context, newEntry: UploadLog) {
            val sharedPreferences: SharedPreferences = context.getSharedPreferences("default", Context.MODE_PRIVATE)
            val editor = sharedPreferences.edit()

            // Retrieve the current list of log entries
            val jsonString = sharedPreferences.getString("uploadLogs", null)
            val gson = Gson()
            val logEntries: MutableList<UploadLog> = if (jsonString != null) {
                val type = object : TypeToken<MutableList<UploadLog>>() {}.type
                gson.fromJson(jsonString, type)
            } else {
                mutableListOf()
            }

            // Add the new log entry to the list
            logEntries.add(newEntry)

            // Convert the updated list to JSON and save it back to SharedPreferences
            val updatedJsonString = gson.toJson(logEntries)
            editor.putString("uploadLogs", updatedJsonString)
            editor.apply()
        }

        fun getLogEntries(context: Context): List<UploadLog>? {
            val sharedPreferences: SharedPreferences = context.getSharedPreferences("default", Context.MODE_PRIVATE)
            val jsonString = sharedPreferences.getString("uploadLogs", null)

            return if (jsonString != null) {
                // Convert the JSON string back to a list of LogEntry objects
                val gson = Gson()
                val type = object : TypeToken<List<UploadLog>>() {}.type
                gson.fromJson(jsonString, type)
            } else {
                null
            }
        }

        fun clearLogEntries(context: Context): Unit {
            val sharedPreferences: SharedPreferences = context.getSharedPreferences("default", Context.MODE_PRIVATE)
            val editor = sharedPreferences.edit()
            editor.remove("uploadLogs")
            editor.apply()
        }

        fun setShouldBeCapturing(state: Boolean, context: Context) {
            val sharedPreferences: SharedPreferences = context.getSharedPreferences("default", Context.MODE_PRIVATE)
            val editor = sharedPreferences.edit()
            editor.putBoolean("shouldBeCapturing", state)
            editor.apply()
        }

        fun getShouldBeCapturing(context: Context): Boolean {
            val sharedPreferences: SharedPreferences = context.getSharedPreferences("default", Context.MODE_PRIVATE)
            return sharedPreferences.getBoolean("shouldBeCapturing", false)
        }

        fun reset(context: Context) {
            val sharedPreferences = context.getSharedPreferences("default", Context.MODE_PRIVATE)

            val edit = sharedPreferences.edit()
            edit.remove("participantId")
            edit.remove("projectId")
            edit.remove("apiUrl")
            edit.remove("key")
            edit.remove("uploadLogs")
            edit.remove("shouldBeCapturing")

            edit.apply()

            val encryptedPath = ScreenCaptureService.getEncryptedImagesPath(context)
            deleteContent(File(encryptedPath))

            val tempPath = ScreenCaptureService.getTempImagesPath(context)
            deleteContent(File(tempPath))
        }
    }
}