package com.screenlife.app.common

import android.content.Context
import android.os.Build
import android.widget.Toast
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import io.ktor.util.cio.readChannel
import kotlinx.serialization.Serializable
import java.io.File

class Api {
    companion object {
        @Serializable
        data class VerifyRegistration(
            val participantId: String,
            val projectId: String,
            val deviceMeta: String
        )

        suspend fun register(
            url: String,
            participantId: String,
            projectId: String,
            context: Context
        ): Boolean {
            val client = HttpClient(CIO) {
                install(ContentNegotiation) {
                    json()
                }
            }

           if (!WiFi.isInternetConnected(context)) {
               if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                   context.mainExecutor.execute {
                       Toast.makeText(context, "No internet connectivity", Toast.LENGTH_SHORT).show()
                   }
               } else {
                   Toast.makeText(context, "No internet connectivity", Toast.LENGTH_SHORT).show()
               }
               return false
           }

            try {
                val deviceMeta = Device.getDeviceInfo()
                val response: HttpResponse = client.post(url) {
                    contentType(ContentType.Application.Json)
                    setBody(VerifyRegistration(participantId, projectId, deviceMeta))
                }
                println(response.status)
            } catch (e: Exception) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    context.mainExecutor.execute {
                        Toast.makeText(context, "Invalid URL $url", Toast.LENGTH_SHORT).show()
                    }
                } else {
                    Toast.makeText(context, "Invalid URL $url", Toast.LENGTH_SHORT).show()
                }
                e.printStackTrace()
                return false
            } finally {
                client.close()
            }
            return true
        }

        @Serializable
        data class SubmitManifestRequest(
            val participantId: String,
            val projectId: String,
            val hash: String,
            val imagesNum: Int
        )

        @Serializable
        data class SubmitManifestResponse(val url: String, val manifestId: String)

        suspend fun submitManifest(
            url: String,
            participantId: String,
            projectId: String,
            hash: String,
            imagesNum: Int
        ): SubmitManifestResponse {
            val client = HttpClient(CIO) {
                install(ContentNegotiation) {
                    json()
                }
            }
            val response: HttpResponse = client.post(url) {
                contentType(ContentType.Application.Json)
                setBody(SubmitManifestRequest(participantId, projectId, hash, imagesNum))
            }
            println(response.status)
            val data = response.body<SubmitManifestResponse>()
            client.close()

            return data
        }

        suspend fun uploadZip(url: String, zipFile: File): HttpStatusCode {
            val client = HttpClient(CIO) {
                install(ContentNegotiation) {
                    json()
                }
                install(HttpTimeout) {
                    requestTimeoutMillis = 1800000 // 30 minutes for the entire request
                    connectTimeoutMillis = 1800000 // 30 minutes for establishing a connection
                }
            }
            val response: HttpResponse = client.put(url) {
                contentType(ContentType.Application.Zip)
                setBody(zipFile.readChannel())
            }
            println(response.status)
            client.close()

            return response.status
        }

        @Serializable
        data class CheckManifestRequest(
            val participantId: String,
            val projectId: String,
            val manifestId: String
        )

        @Serializable
        data class CheckManifestResponse(
            val status: String,
            val message: String,
            val foundMD5: String? = null,
            val expectedMD5: String? = null
        )

        suspend fun checkManifest(
            url: String,
            participantId: String,
            projectId: String,
            manifestId: String
        ): CheckManifestResponse {
            val client = HttpClient(CIO) {
                install(ContentNegotiation) {
                    json()
                }
            }
            val response: HttpResponse = client.post(url) {
                contentType(ContentType.Application.Json)
                setBody(CheckManifestRequest(participantId, projectId, manifestId))
            }
            println(response.status)
            println(response.bodyAsText())
            val data = response.body<CheckManifestResponse>()
            client.close()

            return data
        }
    }

}