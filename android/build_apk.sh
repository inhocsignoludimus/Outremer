#!/bin/sh
# Gera o APK Android (WebView com o jogo em assets/www). uso: sh android/build_apk.sh
# requer: aapt2, zipalign, apksigner, java, android.jar (API 23+), smali.jar (SMALI=caminho)
set -e
cd "$(dirname "$0")"
SDKJAR=${SDKJAR:-/usr/lib/android-sdk/platforms/android-23/android.jar}
SMALI=${SMALI:-/tmp/d8t/alp/package/java-binaries}
KS=${KS:-$HOME/outremer-release.keystore}
rm -rf build && mkdir -p build/assets/www
cp -r ../index.html ../manifest.json ../js ../js_en ../assets build/assets/www/
aapt2 compile --dir res -o build/res.zip
aapt2 link -o build/base.apk -I "$SDKJAR" --manifest AndroidManifest.xml -A build/assets build/res.zip --min-sdk-version 21 --target-sdk-version 34
java -cp "$SMALI/*" com.android.tools.smali.smali.Main assemble -a 21 -o build/classes.dex smali 2>&1 | grep -v JAVA_TOOL || true
(cd build && zip -q base.apk classes.dex)
zipalign -f -p 4 build/base.apk build/aligned.apk
if [ ! -f "$KS" ]; then keytool -genkeypair -keystore "$KS" -alias outremer -keyalg RSA -keysize 2048 -validity 10000 -storepass outremer -keypass outremer -dname "CN=In Hoc Signo Ludimus, O=In Hoc Signo Ludimus, C=BR" 2>&1 | grep -v JAVA_TOOL; fi
apksigner sign --ks "$KS" --ks-pass pass:outremer --key-pass pass:outremer --out build/Outremer.apk build/aligned.apk
apksigner verify build/Outremer.apk && ls -la build/Outremer.apk
