import os
import zipfile
import shutil

ROOT_DIR = os.path.abspath(os.path.dirname(__file__))
ANDROID_DIR = os.path.join(ROOT_DIR, "android-project")
ZIP_DEST = os.path.join(ROOT_DIR, "public", "NekoLoverRead-Android-Package.zip")

if os.path.exists(ANDROID_DIR):
    shutil.rmtree(ANDROID_DIR)

# Directory Structure
dirs = [
    "app/src/main/java/com/nekolover/read",
    "app/src/main/res/layout",
    "app/src/main/res/values",
    "app/src/main/res/mipmap-hdpi",
    "app/src/main/res/mipmap-xhdpi",
    "app/src/main/res/mipmap-xxhdpi",
    "app/src/main/res/mipmap-xxxhdpi",
    "app/src/main/assets/dist",
    "gradle/wrapper"
]

for d in dirs:
    os.makedirs(os.path.join(ANDROID_DIR, d), exist_ok=True)

# 1. AndroidManifest.xml
manifest_content = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.nekolover.read">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""
with open(os.path.join(ANDROID_DIR, "app/src/main/AndroidManifest.xml"), "w", encoding="utf-8") as f:
    f.write(manifest_content)

# 2. MainActivity.java
main_activity_content = """package com.nekolover.read;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webview);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        // Dark background styling
        webView.setBackgroundColor(0xFF121019);
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        // Load offline bundled application
        webView.loadUrl("file:///android_asset/dist/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
"""
with open(os.path.join(ANDROID_DIR, "app/src/main/java/com/nekolover/read/MainActivity.java"), "w", encoding="utf-8") as f:
    f.write(main_activity_content)

# 3. Layout activity_main.xml
layout_content = """<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#121019">
    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</FrameLayout>
"""
with open(os.path.join(ANDROID_DIR, "app/src/main/res/layout/activity_main.xml"), "w", encoding="utf-8") as f:
    f.write(layout_content)

# 4. Values (strings.xml, styles.xml)
strings_content = """<resources>
    <string name="app_name">NekoLover Read</string>
</resources>
"""
with open(os.path.join(ANDROID_DIR, "app/src/main/res/values/strings.xml"), "w", encoding="utf-8") as f:
    f.write(strings_content)

styles_content = """<resources>
    <style name="AppTheme" parent="Theme.AppCompat.NoActionBar">
        <item name="android:windowBackground">#121019</item>
        <item name="android:statusBarColor">#121019</item>
        <item name="android:navigationBarColor">#121019</item>
    </style>
</resources>
"""
with open(os.path.join(ANDROID_DIR, "app/src/main/res/values/styles.xml"), "w", encoding="utf-8") as f:
    f.write(styles_content)

# 5. App build.gradle
app_gradle = """plugins {
    id 'com.android.application'
}

android {
    namespace 'com.nekolover.read'
    compileSdk 34

    defaultConfig {
        applicationId "com.nekolover.read"
        minSdk 23
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
}
"""
with open(os.path.join(ANDROID_DIR, "app/build.gradle"), "w", encoding="utf-8") as f:
    f.write(app_gradle)

# 6. Root build.gradle & settings.gradle
root_gradle = """plugins {
    id 'com.android.application' version '8.2.2' apply false
}
"""
with open(os.path.join(ANDROID_DIR, "build.gradle"), "w", encoding="utf-8") as f:
    f.write(root_gradle)

settings_gradle = """pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "NekoLoverRead"
include ':app'
"""
with open(os.path.join(ANDROID_DIR, "settings.gradle"), "w", encoding="utf-8") as f:
    f.write(settings_gradle)

# 7. gradle-wrapper.properties
wrapper_content = """distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
"""
with open(os.path.join(ANDROID_DIR, "gradle/wrapper/gradle-wrapper.properties"), "w", encoding="utf-8") as f:
    f.write(wrapper_content)

# 8. Copy icons to mipmap
icon_src = os.path.join(ROOT_DIR, "public/pwa-192x192.png")
if os.path.exists(icon_src):
    for m in ["mipmap-hdpi", "mipmap-xhdpi", "mipmap-xxhdpi", "mipmap-xxxhdpi"]:
        shutil.copy(icon_src, os.path.join(ANDROID_DIR, f"app/src/main/res/{m}/ic_launcher.png"))

# 9. Copy dist web assets into assets/dist
dist_src = os.path.join(ROOT_DIR, "dist")
if os.path.exists(dist_src):
    shutil.copytree(dist_src, os.path.join(ANDROID_DIR, "app/src/main/assets/dist"), dirs_exist_ok=True)

# 10. INSTRUCCIONES_COMPILACION_APK.txt
readme_content = """🐾 NEKOLOVER READ — PAQUETE DE PROYECTO ANDROID / APK 🖤
============================================================

Este archivo ZIP contiene el proyecto nativo Android completo configurado con Gradle,
código Java, iconos, recursos y los archivos compilados de la aplicación web
para funcionar 100% OFFLINE en cualquier teléfono o tablet Android.

CÓMO GENERAR TU ARCHIVO .APK EN 2 MINUTOS:

OPCIÓN 1: CON ANDROID STUDIO (Recomendado)
-------------------------------------------
1. Descomprime este archivo ZIP en tu computadora.
2. Abre Android Studio.
3. Haz clic en "Open" y selecciona la carpeta descomprimida "android-project".
4. Espera a que Gradle sincronice las dependencias automáticamente.
5. En el menú superior, ve a:
   Build > Build Bundle(s) / APK(s) > Build APK(s)
6. ¡Listo! Android Studio compilará el archivo:
   app/build/outputs/apk/debug/app-debug.apk
7. Pásalo a tu celular Android y tócalo para instalar.

OPCIÓN 2: POR TERMINAL (Línea de comandos)
-------------------------------------------
En la carpeta del proyecto, ejecuta:
- En Windows:
    gradlew.bat assembleDebug
- En Mac / Linux:
    ./gradlew assembleDebug

El APK se generará en:
app/build/outputs/apk/debug/app-debug.apk

¡Disfruta de NekoLover Read en tu móvil Android! 🐾📖
"""
with open(os.path.join(ANDROID_DIR, "INSTRUCCIONES_COMPILACION_APK.txt"), "w", encoding="utf-8") as f:
    f.write(readme_content)

# 11. Create ZIP Archive
print(f"Creating zip file at {ZIP_DEST}...")
with zipfile.ZipFile(ZIP_DEST, "w", zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(ANDROID_DIR):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, ANDROID_DIR)
            zipf.write(full_path, os.path.join("NekoLoverRead-Android", rel_path))

size_mb = os.path.getsize(ZIP_DEST) / (1024 * 1024)
print(f"ZIP package successfully created! Size: {size_mb:.2f} MB")
