package com.screenlife.capture.app.common

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities

class WiFi {
    companion object {
        sealed class WifiStatus {
            object Connected : WifiStatus()
            object NotConnected : WifiStatus()
            object Unknown : WifiStatus()
        }

        fun isWifiConnected(context: Context): WifiStatus {
            val connectivityManager =
                context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            return when {
                connectivityManager == null -> WifiStatus.Unknown
                connectivityManager.getNetworkCapabilities(connectivityManager.activeNetwork) == null -> WifiStatus.Unknown
                connectivityManager.getNetworkCapabilities(connectivityManager.activeNetwork)!!.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) -> WifiStatus.Connected
                else -> WifiStatus.NotConnected
            }
        }

        fun isInternetConnected(context: Context): Boolean {
            val connectivityManager =
                context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            if (connectivityManager != null) {
                val capabilities =
                    connectivityManager.getNetworkCapabilities(connectivityManager.activeNetwork)
                if (capabilities != null) {
                    return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                }
            }
            return false
        }
    }
}