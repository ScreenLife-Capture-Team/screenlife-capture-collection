package com.screenlife.app.common

import android.os.Build

class Device {
    companion object {
        fun getDeviceInfo(): String {
            val brand = Build.BRAND // The brand of the product/hardware
            val model = Build.MODEL // The end-user-visible name for the end product
            val device = Build.DEVICE // The name of the industrial design
            val manufacturer = Build.MANUFACTURER // The manufacturer of the product/hardware
            val sdkVersion =
                Build.VERSION.SDK_INT // The SDK version of the software currently running on this hardware
            val release = Build.VERSION.RELEASE // The user-visible version string

            return """
                Brand: $brand
                Manufacturer: $manufacturer
                Model: $model
                Device: $device
                Android Version: $release
                SDK Version: $sdkVersion
            """.trimIndent()
        }
    }
}