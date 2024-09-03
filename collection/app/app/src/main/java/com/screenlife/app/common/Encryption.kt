package com.screenlife.app.common

import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.nio.charset.StandardCharsets
import java.security.InvalidAlgorithmParameterException
import java.security.InvalidKeyException
import java.security.MessageDigest
import java.security.NoSuchAlgorithmException
import javax.crypto.Cipher
import javax.crypto.CipherOutputStream
import javax.crypto.NoSuchPaddingException
import javax.crypto.spec.SecretKeySpec

internal object Encryption {
    @Throws(
        IOException::class,
        NoSuchAlgorithmException::class,
        NoSuchPaddingException::class,
        InvalidKeyException::class,
        InvalidAlgorithmParameterException::class
    )

    fun encryptToFile(bais: ByteArrayInputStream, key: ByteArray, outputPath: String, filename: String, appName: String) {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val secretKeySpec = SecretKeySpec(key, "AES")
        cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec)
        val ivBytes = cipher.iv

        val fname = "${filename}_${toHex(ivBytes)}_${appName}.png"
        val fos = FileOutputStream("$outputPath/$fname")

        val cos = CipherOutputStream(fos, cipher)
        var b: Int
        val d = ByteArray(8)
        while ((bais.read(d).also { b = it }) != -1) {
            cos.write(d, 0, b)
        }
        cos.flush()
        cos.close()
        bais.close()
    }
    @Throws(NoSuchAlgorithmException::class)
    private fun getSHA(input: String): ByteArray {
        val md = MessageDigest.getInstance("SHA-256")
        return md.digest(input.toByteArray(StandardCharsets.UTF_8))
    }

    private const val HEX_DIGITS = "0123456789abcdef"
    fun toHex(data: ByteArray): String {
        val buf = StringBuffer()

        for (i in data.indices) {
            val v = data[i].toInt() and 0xff

            buf.append(HEX_DIGITS[v shr 4])
            buf.append(HEX_DIGITS[v and 0xf])

//            buf.append(" ")
        }

        return buf.toString()
    }
    fun hexStringToByteArray(str: String): ByteArray {
        return ByteArray(str.length / 2) { str.substring(it * 2, it * 2 + 2).toInt(16).toByte() }
    }

    fun getMd5ChecksumBase64(file: File): String? {
        return try {
            val md = MessageDigest.getInstance("MD5")
            FileInputStream(file).use { fis ->
                val buffer = ByteArray(1024)
                var bytesRead: Int
                while (fis.read(buffer).also { bytesRead = it } != -1) {
                    md.update(buffer, 0, bytesRead)
                }
            }
            val md5Bytes = md.digest()
            android.util.Base64.encodeToString(md5Bytes, android.util.Base64.NO_WRAP)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}

