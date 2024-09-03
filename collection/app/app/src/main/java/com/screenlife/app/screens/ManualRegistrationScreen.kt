package com.screenlife.app.screens

import android.content.Context
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import com.screenlife.app.ui.theme.ScreenLifeTheme
import kotlinx.serialization.Serializable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.navigation.NavController

@Serializable
object ManualRegistrationScreenRoute
@Composable
fun ManualRegistrationScreen(navController: NavController) {

    val context = LocalContext.current
    val sharedPreferences = context.getSharedPreferences("default", Context.MODE_PRIVATE)

    fun load(string: String): String {
        return sharedPreferences.getString(string, "") ?: ""
    }

    var participantId by remember { mutableStateOf(load("participantId")) }
    var projectId by remember { mutableStateOf(load("projectId")) }
    var apiUrl by remember { mutableStateOf(load("apiUrl")) }

    fun save() {
        val edit = sharedPreferences.edit()
        edit.putString("participantId", participantId)
        edit.putString("projectId", projectId)
        edit.putString("apiUrl", apiUrl)
        edit.apply()
    }

    ScreenLifeTheme {
        Column {
            Text(text = "Registration Screen")
            Text(text="Participant ID")
            TextField(value = participantId, onValueChange = {participantId = it})
            Text(text="Project ID")
            TextField(value = projectId, onValueChange = {projectId = it})
            Text(text="API URL")
            TextField(value = apiUrl, onValueChange = {apiUrl = it})
            Button(onClick = { save() }) {
                Text(text = "Save")
            }
        }
    }
}