package com.chat

import android.content.Intent
import android.content.pm.PackageManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class AppLauncherModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return "AppLauncherModule"
  }

  @ReactMethod
  fun isAppInstalled(packageName: String, promise: Promise) {
    try {
      val pm = reactContext.packageManager
      pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES)
      promise.resolve(true)
    } catch (e: PackageManager.NameNotFoundException) {
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun launchApp(packageName: String, promise: Promise) {
    val launchIntent = reactContext.packageManager.getLaunchIntentForPackage(packageName)
    if (launchIntent != null) {
      launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(launchIntent)
      promise.resolve(null)
    } else {
      promise.reject("LAUNCH_ERROR", "App not found")
    }
  }
}
