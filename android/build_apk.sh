#!/bin/sh
# Gera o APK "Outremer Dawn" (pacote separado do Ludimus).
# WebView carrega file:///android_asset/www/index.html. Os assets pintados
# funcionam com origin null porque meta.json vai em .js e as texturas lidas
# por getImageData vão em js/wv_pix.js (data: URI). ver tools/pack_wv_pix.py.
# uso: sh android/build_apk.sh
# requer: aapt2, zipalign, apksigner, java, android.jar (API 23+), smali.jar
set -e
cd "$(dirname "$0")"
python3 ../tools/pack_wv_pix.py
SDKJAR=${SDKJAR:-/workspace/outremer-2.4/apk-tools/android-6.0/android.jar}
SMALIJAR=${SMALIJAR:-/workspace/outremer-2.4/apk-tools/smali.jar}
KS=${KS:-/workspace/outremer-2.4/apk-tools/debug.keystore}
OUT=${OUT:-/workspace/outremer-2.4/outremer-ludimus-dawn.apk}
rm -rf build && mkdir -p build/assets/www
cp -r ../index.html ../manifest.json ../js ../js_en ../assets build/assets/www/
aapt2 compile --dir res -o build/res.zip
aapt2 link -o build/base.apk -I "$SDKJAR" --manifest AndroidManifest.xml -A build/assets build/res.zip --min-sdk-version 21 --target-sdk-version 34
java -jar "$SMALIJAR" assemble -a 21 -o build/classes.dex smali
python3 -c "import zipfile; z=zipfile.ZipFile('build/base.apk','a'); z.write('build/classes.dex','classes.dex')"
zipalign -f -p 4 build/base.apk build/aligned.apk
apksigner sign --ks "$KS" --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out "$OUT" build/aligned.apk
apksigner verify --verbose "$OUT"
aapt dump badging "$OUT" | head -8
ls -la "$OUT"
