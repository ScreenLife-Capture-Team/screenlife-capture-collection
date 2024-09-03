package com.screenlife.app.screens

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.navigation.NavController
import com.screenlife.app.ui.theme.ScreenLifeTheme
import kotlinx.serialization.Serializable

@Serializable
object OtherScreenRoute
@Composable
fun OtherScreen(navController: NavController) {

    ScreenLifeTheme {
        Column {
            Text(text = "Other Screen")
        }
    }
}