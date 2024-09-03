package com.screenlife.app.services.upload

import android.content.Context
import android.util.Log
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import java.util.Calendar
import java.util.concurrent.ExecutionException
import java.util.concurrent.TimeUnit

class UploadScheduler {

    companion object {
        private const val UPLOAD_TRIGGER_WORK_NAME = "UPLOAD_TRIGGER"
        private const val UPLOAD_WORK_NAME = "UPLOAD"
        fun cancelRunningUpload(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(UPLOAD_WORK_NAME)
        }

        fun isUploadScheduled(context: Context): Boolean {
            val instance = WorkManager.getInstance(context)
            val statuses = instance.getWorkInfosForUniqueWork(UPLOAD_WORK_NAME)

            var running = false
            var workInfoList: List<WorkInfo> = emptyList() // Singleton, no performance penalty

            try {
                workInfoList = statuses.get()
            } catch (e: ExecutionException) {
                Log.d("WS", "ExecutionException in isWorkScheduled: $e")
            } catch (e: InterruptedException) {
                Log.d("WS", "InterruptedException in isWorkScheduled: $e")
            }

            for (workInfo in workInfoList) {
                val state = workInfo.state
                running = running || (state == WorkInfo.State.RUNNING || state == WorkInfo.State.ENQUEUED)
            }

            return running
        }

        fun scheduleNext(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(UPLOAD_WORK_NAME)

            val workRequest = OneTimeWorkRequestBuilder<UploadWorker>()
                .setInitialDelay(2, TimeUnit.SECONDS)
                .build()

            // Enqueue the work
            WorkManager.getInstance(context).enqueueUniqueWork(
                UPLOAD_WORK_NAME,
                ExistingWorkPolicy.APPEND_OR_REPLACE,
                workRequest
            )
        }

        fun scheduleDailyUploadTrigger(context: Context) {

            // Calculate the initial delay to set the time of execution
            val currentDateTime = Calendar.getInstance()

            // Set the time to run the work (e.g., 5:00 AM)
            val runTime = Calendar.getInstance()
            runTime.set(Calendar.HOUR_OF_DAY, 5) // 5AM
            runTime.set(Calendar.MINUTE, 0)
            runTime.set(Calendar.SECOND, 0)

            // If the set time is before the current time, schedule for the next day
            if (runTime.before(currentDateTime)) {
                runTime.add(Calendar.HOUR_OF_DAY, 24)
            }

            // Calculate the initial delay
            val initialDelay = runTime.timeInMillis - currentDateTime.timeInMillis

            // Create a work request
            val workRequest = PeriodicWorkRequestBuilder<UploadTriggerWorker>(24, TimeUnit.HOURS)
                .setInitialDelay(initialDelay, TimeUnit.MILLISECONDS)
                .build()

            // Enqueue the work
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UPLOAD_TRIGGER_WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE, // Replace if there's an existing work with the same name
                workRequest
            )

            // Cancel legacy work
            WorkManager.getInstance(context).cancelUniqueWork("DailyTask1")
            WorkManager.getInstance(context).cancelUniqueWork("DailyTask2")
            WorkManager.getInstance(context).cancelUniqueWork("DailyTask3")
            WorkManager.getInstance(context).cancelUniqueWork("DailyTask4")
        }
    }

}