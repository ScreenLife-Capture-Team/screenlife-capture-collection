// MediaProjectionViewModel.kt
import android.app.Activity
import android.app.Application
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import androidx.annotation.RequiresApi
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import com.screenlife.app.services.capture.ScreenCaptureService

class MediaProjectionViewModel(application: Application) : AndroidViewModel(application) {
    private val _projectionStatus = MutableLiveData<Boolean>()
    val projectionStatus: LiveData<Boolean> = _projectionStatus

    private var mediaProjection: MediaProjection? = null
    var mediaProjectionManager: MediaProjectionManager? = null

    init {
        initProjectionManager(application)
    }

    private fun initProjectionManager(context: Context) {
        mediaProjectionManager = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
    }

    @RequiresApi(Build.VERSION_CODES.O)
    fun handleActivityResult(resultCode: Int, data: Intent?) {
        Handler().postDelayed({
            if (resultCode == Activity.RESULT_OK && data != null) {
                println("Media projection started!")
                mediaProjectionManager?.let {
                    ScreenCaptureService.startService(getApplication(),
                        it, resultCode, data)
                }
//                mediaProjection = mediaProjectionManager?.getMediaProjection(resultCode, data)
//                mediaProjection?.let {
//                    println("Starting service..")

//                }
                _projectionStatus.value = true
            } else {
                _projectionStatus.value = false
            }
        }, 1000)

    }

    fun stopProjection() {
        mediaProjection?.stop()
        mediaProjection = null
        ScreenCaptureService.stopService(getApplication())
        _projectionStatus.value = false
    }

    fun manuallyUpdateProjectionStatus(status: Boolean) {
        _projectionStatus.value = status
    }
}
