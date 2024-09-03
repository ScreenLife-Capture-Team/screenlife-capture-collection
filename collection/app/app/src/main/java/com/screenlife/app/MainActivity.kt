package com.screenlife.app

import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.annotation.RequiresApi
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.screenlife.app.screens.HomeScreen
import com.screenlife.app.screens.HomeScreenRoute
import com.screenlife.app.screens.ImagesScreen
import com.screenlife.app.screens.ImagesScreenRoute
import com.screenlife.app.screens.ManualRegistrationScreen
import com.screenlife.app.screens.ManualRegistrationScreenRoute
import com.screenlife.app.screens.OtherScreen
import com.screenlife.app.screens.OtherScreenRoute
import com.screenlife.app.screens.QrRegistrationScreen
import com.screenlife.app.screens.QrRegistrationScreenRoute
import com.screenlife.app.screens.StopActivityScreen
import com.screenlife.app.screens.StopActivityScreenRoute
import com.screenlife.app.screens.UploadLogsScreen
import com.screenlife.app.screens.UploadLogsScreenRoute
import com.screenlife.app.ui.theme.ScreenLifeTheme

class MainActivity : ComponentActivity() {
    @RequiresApi(Build.VERSION_CODES.O)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ScreenLifeTheme {
                // A surface container using the 'background' color from the theme
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    NavHost(navController = navController, startDestination = HomeScreenRoute, builder = {
                        composable<HomeScreenRoute> {
                            HomeScreen(navController)
                        }
                        composable<QrRegistrationScreenRoute> {
                            QrRegistrationScreen(navController)
                        }
                        composable<ManualRegistrationScreenRoute> {
                            ManualRegistrationScreen(navController)
                        }
                        composable<ImagesScreenRoute> {
                            ImagesScreen(navController)
                        }
                        composable<StopActivityScreenRoute> {
                            StopActivityScreen(navController)
                        }
                        composable<UploadLogsScreenRoute> {
                            UploadLogsScreen(navController)
                        }
                        composable<OtherScreenRoute> {
                            OtherScreen(navController)
                        }
                    })
                }
            }
        }
    }
}