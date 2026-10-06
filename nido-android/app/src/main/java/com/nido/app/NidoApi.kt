package com.nido.app

import com.google.gson.JsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

object NidoApi {
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()
    private val JSON = "application/json".toMediaType()

    /** Llama a POST {baseUrl}/api/rpc/{name} con cuerpo { data: {...} } y devuelve "result" como JsonObject/JsonArray. */
    fun call(baseUrl: String, name: String, data: JsonObject): com.google.gson.JsonElement {
        val body = JsonObject().apply { add("data", data) }.toString().toRequestBody(JSON)
        val req = Request.Builder().url("$baseUrl/api/rpc/$name").post(body).build()
        client.newCall(req).execute().use { res ->
            val text = res.body?.string() ?: "{}"
            val json = com.google.gson.JsonParser.parseString(text).asJsonObject
            if (!res.isSuccessful) {
                throw Exception(json.get("error")?.asString ?: "Error ${res.code}")
            }
            return json.get("result")
        }
    }
}
