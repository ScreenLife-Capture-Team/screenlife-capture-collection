package com.screenlife.app.screens

import android.content.Context
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavController
import com.screenlife.app.common.Api
import com.screenlife.app.ui.theme.ScreenLifeTheme
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import qrscanner.QrScanner

@Serializable
object QrRegistrationScreenRoute

@Serializable
data class Data(val e: String, val p: String, val i: String, val k: String)


@Composable
fun QrRegistrationScreen(navController: NavController) {

    val context = LocalContext.current
    val sharedPreferences = context.getSharedPreferences("default", Context.MODE_PRIVATE)

    var trying by remember {
        mutableStateOf(false)
    }

    ScreenLifeTheme {
        Column {
            QrScanner(modifier = Modifier.fillMaxSize(), flashlightOn = false, launchGallery = false, onFailure = { println("ERR $it")}, onGalleryCallBackHandler = {}, onCompletion = {
                println("Scanned!")
                if (!trying) {
                    try {
                        trying = true
                        val result = Json.decodeFromString(Data.serializer(), it)
                        println("Result ${result.p} ${result.i}")

                        val url = result.e + "/verifyRegistration"
                        println("Registering.. on $url")
                        val coroutineScope = CoroutineScope(Dispatchers.IO)
                        coroutineScope.launch {
                            val success = Api.register(url, result.i, result.p, context)
                            if (!success) return@launch

                            val edit = sharedPreferences.edit()
                            edit.putString("participantId", result.i)
                            edit.putString("projectId", result.p)
                            edit.putString("apiUrl", result.e)
                            edit.putString("key", result.k)
                            edit.apply()

                            withContext(Dispatchers.Main) {
                                navController.navigateUp()
                            }
                        }
                    } catch (e: Exception) {
                        throw e
                    } finally {
                        trying = false
                    }
                }
            })
        }
    }
}