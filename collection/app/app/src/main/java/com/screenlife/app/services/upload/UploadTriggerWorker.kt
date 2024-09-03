package com.screenlife.app.services.upload

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters

class UploadTriggerWorker(appContext: Context, workerParams: WorkerParameters) :
    Worker(appContext, workerParams) {
    override fun doWork(): Result {
        UploadScheduler.scheduleNext(applicationContext)
        return Result.success()
    }
}
